using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class PoiAndDeviceTrackingTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly DeviceTrackingService _deviceTrackingService;
    private readonly PoiService _poiService;

    public PoiAndDeviceTrackingTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuidePoiTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);

        // Dummy storage service for tests
        var storageMock = new SupabaseStorageService();
        _deviceTrackingService = new DeviceTrackingService(_context);
        _poiService = new PoiService(_context, storageMock);

        SeedLanguagesAndUser();
    }

    private void SeedLanguagesAndUser()
    {
        var admin = new User
        {
            UserId = 1,
            Username = "admin_test",
            Email = "admin@zooguide.vn",
            PasswordHash = "hash",
            FullName = "Admin Test",
            Role = UserRole.Admin,
            Status = UserStatus.Active
        };
        _context.Users.Add(admin);

        var vi = new Language { LanguageId = 1, Code = "vi", Name = "Tiếng Việt", NativeName = "Tiếng Việt", IsActive = true };
        var en = new Language { LanguageId = 2, Code = "en", Name = "English", NativeName = "English", IsActive = true };
        var fr = new Language { LanguageId = 3, Code = "fr", Name = "French", NativeName = "Français", IsActive = true };

        _context.Languages.AddRange(vi, en, fr);
        _context.SaveChanges();
    }

    [Fact]
    public async Task DeviceTracking_RecordsHeartbeat_AndCountsActiveDevicesWithin5Minutes()
    {
        var installId1 = "device-uuid-test-001";
        var installId2 = "device-uuid-test-002";

        // Record heartbeat for device 1
        var res1 = await _deviceTrackingService.RecordHeartbeatAsync(installId1, "Mozilla/5.0 Test", "127.0.0.1");
        Assert.True(res1.Success);
        Assert.Equal(1, res1.HeartbeatCount);

        // Record heartbeat for device 2
        var res2 = await _deviceTrackingService.RecordHeartbeatAsync(installId2, "Mobile Safari", "127.0.0.2");
        Assert.True(res2.Success);

        // Active devices within 5 minutes should be 2
        var activeCount = await _deviceTrackingService.GetActiveDevicesCountAsync(5);
        Assert.Equal(2, activeCount);

        // Summary should match
        var summary = await _deviceTrackingService.GetSummaryAsync();
        Assert.Equal(2, summary.ActiveCount5Minutes);
        Assert.Equal(2, summary.TotalTrackedInstallations);
    }

    [Fact]
    public async Task DeviceTracking_OldDevice_ExpiresFromActiveCount()
    {
        var oldDeviceId = "device-uuid-old-999";
        var oldDevice = new DeviceActivity
        {
            InstallationId = oldDeviceId,
            FirstSeenAt = DateTime.UtcNow.AddMinutes(-30),
            LastSeenAt = DateTime.UtcNow.AddMinutes(-15), // Seen 15 mins ago
            HeartbeatCount = 5
        };
        _context.DeviceActivities.Add(oldDevice);
        await _context.SaveChangesAsync();

        // 5-minute active window should NOT count this device
        var activeCount = await _deviceTrackingService.GetActiveDevicesCountAsync(5);
        Assert.Equal(0, activeCount);

        // But total installations should still include it
        var summary = await _deviceTrackingService.GetSummaryAsync();
        Assert.Equal(1, summary.TotalTrackedInstallations);
        Assert.Equal(0, summary.ActiveCount5Minutes);
    }

    [Fact]
    public async Task PoiService_CreateAndVerifyCoordinates_PersistsSuccessfully()
    {
        var createDto = new CreatePoiDto
        {
            Code = "POI-TEST-01",
            Name = "Vườn Xương Rồng Sa Mạc",
            Description = "Bộ sưu tập xương rồng độc đáo từ châu Mỹ và châu Phi.",
            Category = "Botanical",
            Latitude = 10.7879100m,
            Longitude = 106.7051200m,
            IsActive = true,
            IsCoordinateVerified = false
        };

        var poi = await _poiService.CreateAsync(createDto);
        Assert.NotNull(poi);
        Assert.Equal("POI-TEST-01", poi.Code);
        Assert.False(poi.IsCoordinateVerified);

        // Verify coordinates with reference source
        var verifySuccess = await _poiService.VerifyCoordinatesAsync(poi.PoiId, true, "Đo đạc thực tế RTK GPS");
        Assert.True(verifySuccess);

        var updated = await _poiService.GetByIdAsync(poi.PoiId);
        Assert.NotNull(updated);
        Assert.True(updated.IsCoordinateVerified);
        Assert.Equal("Đo đạc thực tế RTK GPS", updated.VerificationSource);
    }

    [Fact]
    public async Task PoiService_MultilingualNarration_SupportsFallbackLanguage()
    {
        // 1. Create a POI
        var poi = await _poiService.CreateAsync(new CreatePoiDto
        {
            Code = "POI-TEST-FALLBACK",
            Name = "Khu Vực Đài Phun Nước",
            Category = "Landmark",
            Latitude = 10.7865000m,
            Longitude = 106.7048000m
        });

        // 2. Add Vietnamese narration only
        var viNarration = await _poiService.AddNarrationAsync(poi.PoiId, new CreatePoiNarrationDto
        {
            LanguageId = 1, // vi
            Title = "Đài Phun Nước Nghệ Thuật",
            Content = "Đài phun nước xây dựng từ thời kỳ đầu thế kỷ 20...",
            AudioUrl = "https://example.com/audio/fountain_vi.mp3",
            DurationSeconds = 120,
            Status = "Published"
        });
        Assert.NotNull(viNarration);

        // 3. Requesting French ('fr') which is not yet published -> should fallback to Vietnamese
        var publicNarration = await _poiService.GetPublicNarrationAsync(poi.PoiId, "fr");
        Assert.NotNull(publicNarration);
        Assert.True(publicNarration.IsFallbackLanguage);
        Assert.Equal("vi", publicNarration.LanguageCode);
        Assert.Equal("Đài Phun Nước Nghệ Thuật", publicNarration.Title);
        Assert.True(publicNarration.HasAudio);

        // 4. Requesting Vietnamese directly -> no fallback
        var viPublic = await _poiService.GetPublicNarrationAsync(poi.PoiId, "vi");
        Assert.NotNull(viPublic);
        Assert.False(viPublic.IsFallbackLanguage);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
