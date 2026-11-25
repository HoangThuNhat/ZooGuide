using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.API.Controllers;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
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

    [Fact]
    public async Task DeviceTracking_TenConsecutiveHeartbeatsSameDevice_CountsAsOneDevice()
    {
        for (int i = 0; i < 10; i++)
        {
            var idVariant = i % 2 == 0 ? "Device-UUID-Repeat-001" : "device-uuid-repeat-001";
            var res = await _deviceTrackingService.RecordHeartbeatAsync(idVariant, "Chrome/120", "127.0.0.1");
            Assert.True(res.Success);
            Assert.Equal(i + 1, res.HeartbeatCount);
        }

        Assert.Equal(1, await _deviceTrackingService.GetActiveDevicesCountAsync(60));
        var summary = await _deviceTrackingService.GetSummaryAsync(60);
        Assert.Equal(1, summary.ActiveCount60Seconds);
        Assert.Equal(1, summary.ActiveCount5Minutes);
        Assert.Equal(1, summary.TotalTrackedInstallations);
    }

    [Fact]
    public async Task DeviceTracking_ReloadAndThreeTabsSameDevice_CountsAsOneDevice()
    {
        const string deviceId = "device-multitab-001";
        using var tracker = new OnlineUserTracker();
        var dashboardService = new DashboardService(_context, tracker);

        // 3 tabs open on same browser + HTTP heartbeats
        tracker.RegisterDeviceConnection(deviceId, "conn-tab-1");
        tracker.RegisterDeviceConnection(deviceId, "conn-tab-2");
        tracker.RegisterDeviceConnection(deviceId, "conn-tab-3");
        tracker.RefreshHeartbeat(deviceId, "conn-tab-1", isTicketBuyer: false, buyerKey: null);
        await _deviceTrackingService.RecordHeartbeatAsync(deviceId, "Chrome", "10.0.0.1");
        await _deviceTrackingService.RecordHeartbeatAsync(deviceId, "Chrome", "10.0.0.1");

        // Reload tab 1 (disconnect old conn-tab-1, connect conn-tab-1-reloaded)
        tracker.RemoveDeviceConnection(deviceId, "conn-tab-1");
        tracker.RegisterDeviceConnection(deviceId, "conn-tab-1-reloaded");
        tracker.RefreshHeartbeat(deviceId, "conn-tab-1-reloaded", isTicketBuyer: false, buyerKey: null);

        Assert.Equal(1, tracker.GetActiveDevicesCount());
        Assert.Equal(1, await _deviceTrackingService.GetActiveDevicesCountAsync(60));

        var stats = await dashboardService.GetStatsAsync();
        Assert.Equal(1, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(1, stats.DbActiveDevices1MinCount);

        // Closing 1 of 3 tabs keeps the device online
        var wentOffline = tracker.RemoveDeviceConnection(deviceId, "conn-tab-2");
        Assert.False(wentOffline);
        Assert.Equal(1, tracker.GetActiveDevicesCount());
    }

    [Fact]
    public async Task DeviceTracking_TwoDistinctDevices_CountsAsTwoDevices()
    {
        using var tracker = new OnlineUserTracker();
        var dashboardService = new DashboardService(_context, tracker);

        await _deviceTrackingService.RecordHeartbeatAsync("device-alpha-01", "Chrome", "10.0.0.1");
        await _deviceTrackingService.RecordHeartbeatAsync("device-beta-02", "Safari", "10.0.0.2");
        tracker.RefreshHeartbeat("device-alpha-01", "http-heartbeat", isTicketBuyer: false, buyerKey: null);
        tracker.RefreshHeartbeat("device-beta-02", "http-heartbeat", isTicketBuyer: false, buyerKey: null);

        Assert.Equal(2, await _deviceTrackingService.GetActiveDevicesCountAsync(60));
        var stats = await dashboardService.GetStatsAsync();
        Assert.Equal(2, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(2, stats.DbActiveDevices1MinCount);
        Assert.Equal(2, stats.OnlineDevicesCombined5MinCount);
    }

    [Fact]
    public async Task DeviceTracking_SignalRReconnect_DoesNotDuplicateDevice()
    {
        const string deviceId = "device-reconnect-001";
        using var tracker = new OnlineUserTracker();
        var dashboardService = new DashboardService(_context, tracker);

        tracker.RegisterDeviceConnection(deviceId, "conn-initial");
        tracker.RefreshHeartbeat(deviceId, "conn-initial", isTicketBuyer: false, buyerKey: null);
        await _deviceTrackingService.RecordHeartbeatAsync(deviceId, "Mobile Safari", "10.0.0.5");

        // Simulate network drop and automatic reconnect with new SignalR connectionId
        tracker.RemoveDeviceConnection(deviceId, "conn-initial");
        tracker.RegisterDeviceConnection(deviceId, "conn-reconnected-2");
        tracker.RefreshHeartbeat(deviceId, "conn-reconnected-2", isTicketBuyer: false, buyerKey: null);
        await _deviceTrackingService.RecordHeartbeatAsync(deviceId, "Mobile Safari", "10.0.0.5");

        Assert.Equal(1, tracker.GetActiveDevicesCount());
        Assert.Equal(1, await _deviceTrackingService.GetActiveDevicesCountAsync(60));
        var stats = await dashboardService.GetStatsAsync();
        Assert.Equal(1, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(1, stats.SignalRVerifiedDevicesCount);
    }

    [Fact]
    public async Task DeviceTracking_Disconnect_ImmediatelyMarksDeviceOfflineAcrossServicesAndDashboard()
    {
        const string deviceId = "device-disconnect-001";
        using var tracker = new OnlineUserTracker();
        var dashboardService = new DashboardService(_context, tracker);

        await _deviceTrackingService.RecordHeartbeatAsync(deviceId, "Chrome", "10.0.0.9");
        tracker.RegisterDeviceConnection(deviceId, "conn-1");
        tracker.RefreshHeartbeat(deviceId, "conn-1", isTicketBuyer: false, buyerKey: null);

        // Record a recent telemetry event right before disconnect
        await dashboardService.RecordTelemetryEventAsync(new RecordTelemetryEventRequest
        {
            Category = "AUDIO",
            EventType = "PLAY_STARTED",
            InstallationId = deviceId,
            LanguageCode = "vi",
            IsSuccess = true
        });

        Assert.Equal(1, await _deviceTrackingService.GetActiveDevicesCountAsync(60));

        // Ensure DisconnectedAt is strictly after telemetry CreatedAt
        await Task.Delay(20);

        // Device closes last tab and sends disconnect beacon
        var disconnected = await _deviceTrackingService.RecordDisconnectAsync(deviceId);
        Assert.True(disconnected);
        tracker.RemoveDeviceConnection(deviceId, "beacon");

        // Must immediately drop to 0 everywhere (60s, 5m, DashboardStats, OnlineUsers API)
        Assert.Equal(0, await _deviceTrackingService.GetActiveDevicesCountAsync(60));
        var summary = await _deviceTrackingService.GetSummaryAsync(60);
        Assert.Equal(0, summary.ActiveCount60Seconds);
        Assert.Equal(0, summary.ActiveCount5Minutes);

        var stats = await dashboardService.GetStatsAsync();
        Assert.Equal(0, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(0, stats.DbActiveDevices1MinCount);
        Assert.Equal(0, stats.OnlineDevicesCombined5MinCount);
        Assert.Equal(0, stats.ActiveDevices);

        var dashboardController = new DashboardController(dashboardService);
        var onlineUsersResult = await dashboardController.GetOnlineUsers(tracker, _context, _deviceTrackingService);
        var okResult = Assert.IsType<OkObjectResult>(onlineUsersResult);
        var payload = Assert.IsType<ApiResponse<OnlineUsersSummaryDto>>(okResult.Value);
        Assert.Equal(0, payload.Data!.ActiveDevices);
    }

    [Fact]
    public async Task DeviceTracking_ExpiredPast60SecTtl_NotCountedIn1MinActiveWindow()
    {
        var now = DateTime.UtcNow;
        _context.DeviceActivities.Add(new DeviceActivity
        {
            InstallationId = "device-ttl-expired-75s",
            FirstSeenAt = now.AddMinutes(-3),
            LastSeenAt = now.AddSeconds(-75),
            HeartbeatCount = 4,
            IsActive = true,
            DisconnectedAt = null
        });
        await _context.SaveChangesAsync();

        var dashboardService = new DashboardService(_context);
        Assert.Equal(0, await _deviceTrackingService.GetActiveDevicesCountAsync(60));
        var summary = await _deviceTrackingService.GetSummaryAsync(60);
        Assert.Equal(0, summary.ActiveCount60Seconds);
        Assert.Equal(1, summary.ActiveCount5Minutes);

        var stats = await dashboardService.GetStatsAsync();
        Assert.Equal(0, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(0, stats.DbActiveDevices1MinCount);
        Assert.Equal(1, stats.OnlineDevicesCombined5MinCount);
    }

    [Fact]
    public async Task DeviceTracking_AdminDashboardMonitor_IsExcludedFromVisitorActiveDevices()
    {
        const string adminMonitorId = "admin_dashboard_1764000000000";
        using var tracker = new OnlineUserTracker();
        var dashboardService = new DashboardService(_context, tracker);

        tracker.RegisterDeviceConnection(adminMonitorId, "conn-admin-1");
        tracker.RefreshHeartbeat(adminMonitorId, "conn-admin-1", isTicketBuyer: false, buyerKey: null);
        var hbRes = await _deviceTrackingService.RecordHeartbeatAsync(adminMonitorId, "AdminChrome", "127.0.0.1");

        Assert.False(hbRes.Success);
        Assert.Equal(0, tracker.GetActiveDevicesCount());
        Assert.Equal(0, await _deviceTrackingService.GetActiveDevicesCountAsync(60));

        var stats = await dashboardService.GetStatsAsync();
        Assert.Equal(0, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(0, stats.OnlineDevicesCombined5MinCount);
        Assert.Equal(0, stats.TotalTrackedDevices);
    }

    [Fact]
    public async Task SpeciesService_UntranslatedVietnameseDbRow_TruthfulHasTranslation_AndGenuineEnglish()
    {
        var species = new Species
        {
            Name = "Voi Châu Á",
            ScientificName = "Elephas maximus",
            ConservationStatus = "EN - Nguy cấp",
            Habitat = "Rừng nhiệt đới và cận nhiệt đới Nam và Đông Nam Á",
            Diet = "Cỏ tươi, lá cây",
            Lifespan = "60 - 70 năm",
            Description = "Tên khoa học: Elephas maximus. Sinh cảnh: Rừng nhiệt đới."
        };
        _context.Species.Add(species);
        await _context.SaveChangesAsync();

        // Simulate legacy broken DB translation rows that still contain Vietnamese text
        _context.ContentTranslations.AddRange(
            new ContentTranslation
            {
                EntityType = "Species",
                EntityId = species.SpeciesId,
                LanguageCode = "en",
                Title = "Voi Châu Á (Elephas maximus)",
                Description = "Tên khoa học: Elephas maximus. Tình trạng: EN - Nguy cấp",
                IsPublished = true
            },
            new ContentTranslation
            {
                EntityType = "Species",
                EntityId = species.SpeciesId,
                LanguageCode = "fr",
                Title = "Voi Châu Á (Elephas maximus)",
                Description = "Tên khoa học: Elephas maximus.",
                IsPublished = true
            }
        );
        await _context.SaveChangesAsync();

        var speciesService = new SpeciesService(_context);

        var enList = (await speciesService.GetAllAsync(lang: "en")).ToList();
        var enItem = Assert.Single(enList);
        Assert.Equal("Asian Elephant", enItem.Name);
        Assert.Equal("EN - Endangered", enItem.ConservationStatus);
        Assert.True(enItem.HasTranslation);
        Assert.False(LocalizationHelper.ContainsVietnameseText(enItem.Name));
        Assert.False(LocalizationHelper.ContainsVietnameseText(enItem.Description));

        // French row has Vietnamese text and no French catalog -> MUST truthfully return HasTranslation = false
        var frList = (await speciesService.GetAllAsync(lang: "fr")).ToList();
        var frItem = Assert.Single(frList);
        Assert.False(frItem.HasTranslation);
    }

    [Fact]
    public async Task PoiService_GetAllAsync_SupportsGateAliasAndEnglishLocalization()
    {
        var gate = new PointOfInterest
        {
            Code = "GATE-A",
            Name = "Cổng Chính A (Lê Duẩn & Nguyễn Bỉnh Khiêm)",
            Description = "Cổng vào chính Thảo Cầm Viên đối diện đại lộ Lê Duẩn.",
            Category = "Entrance",
            Latitude = 10.785800m,
            Longitude = 106.704600m,
            RadiusMeters = 50m,
            IsActive = true,
            IsCoordinateVerified = true,
            CreatedBy = 1
        };
        _context.PointsOfInterest.Add(gate);
        await _context.SaveChangesAsync();

        var filteredGates = (await _poiService.GetAllAsync(new PoiFilterDto
        {
            Category = "gate",
            IsActive = true,
            LanguageCode = "en"
        })).ToList();

        var dto = Assert.Single(filteredGates);
        Assert.Equal("GATE-A", dto.Code);
        Assert.Equal("Main Gate A (Le Duan & Nguyen Binh Khiem)", dto.Name);
        Assert.True(dto.HasTranslation);
        Assert.Equal(50m, dto.RadiusMeters);
    }

    [Fact]
    public async Task LocalizationHelper_ValidDbTranslation_TakesPrecedenceOverReferenceCatalog()
    {
        var species = new Species
        {
            Name = "Hổ Bengal",
            ScientificName = "Panthera tigris tigris",
            ConservationStatus = "EN - Nguy cấp"
        };
        _context.Species.Add(species);
        await _context.SaveChangesAsync();

        _context.ContentTranslations.Add(new ContentTranslation
        {
            EntityType = "Species",
            EntityId = species.SpeciesId,
            LanguageCode = "en",
            Title = "Royal Bengal Tiger (Custom DB)",
            Description = "Custom curated English description from DB.",
            IsPublished = true
        });
        await _context.SaveChangesAsync();

        var speciesService = new SpeciesService(_context);
        var dto = await speciesService.GetByIdAsync(species.SpeciesId, "en");

        Assert.NotNull(dto);
        Assert.True(dto!.HasTranslation);
        Assert.Equal("Royal Bengal Tiger (Custom DB)", dto.Name);
        Assert.Equal("Custom curated English description from DB.", dto.Description);
    }

    [Fact]
    public void EnclosureResponse_DefaultsToCentralizedRadiusMeters()
    {
        var resp = new EnclosureResponse();
        Assert.Equal(LocalizationHelper.DefaultEnclosureRadiusMeters, resp.RadiusMeters);
        Assert.Equal(30m, resp.RadiusMeters);
    }

    [Fact]
    public void LocalizationHelper_CalibratedEnclosureRadii_PreventsTightClusterOverlap()
    {
        Assert.Equal(14m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-HOR-01"));
        Assert.Equal(14m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-COC-01"));
        Assert.Equal(14m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-ORA-01"));
        Assert.Equal(20m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-TIG-01"));
        Assert.Equal(20m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-TIG-02"));
        Assert.Equal(28m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-HOG-01"));
        Assert.Equal(35m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-PET-01"));
        Assert.Equal(30m, LocalizationHelper.GetRecommendedEnclosureRadiusMeters("ENC-UNKNOWN-99"));
    }

    [Fact]
    public void LocalizationHelper_TryReadSidecarVtt_ReturnsNullWhenNoRealVttExists()
    {
        var missing = LocalizationHelper.TryReadSidecarVtt(
            "https://example.com/storage/v1/object/public/narration-audio/vi/nonexistent_999_vi.mp3",
            "vi/nonexistent_999_vi.mp3");
        Assert.Null(missing);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
