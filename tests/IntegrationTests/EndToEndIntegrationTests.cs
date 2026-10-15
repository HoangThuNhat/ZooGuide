using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.API.Controllers;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Repositories;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class EndToEndIntegrationTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly DashboardService _dashboardService;
    private readonly SpeciesService _speciesService;
    private readonly TicketService _ticketService;
    private readonly TicketSessionService _ticketSessionService;
    private readonly NarrationService _narrationService;
    private readonly ChatbotService _chatbotService;
    private readonly AuditLogService _auditLogService;

    public EndToEndIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuideTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);

        // Repositories
        var ticketRepo = new TicketRepository(_context);
        var sessionRepo = new TicketSessionRepository(_context);

        // Services
        _auditLogService = new AuditLogService();
        _dashboardService = new DashboardService(_context);
        _speciesService = new SpeciesService(_context);
        _ticketSessionService = new TicketSessionService(ticketRepo, sessionRepo);
        _ticketService = new TicketService(_context, _ticketSessionService);
        _narrationService = new NarrationService(_context);
        _chatbotService = new ChatbotService(_context);

        // Seed basic fixtures
        SeedDatabase();
    }

    private void SeedDatabase()
    {
        var admin = new User
        {
            UserId = 1,
            Username = "admin",
            Email = "admin@zooguide.vn",
            PasswordHash = "hash123",
            FullName = "Quản trị viên",
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(admin);

        var langVi = new Language { LanguageId = 1, Code = "vi", Name = "Tiếng Việt", IsActive = true };
        var langEn = new Language { LanguageId = 2, Code = "en", Name = "English", IsActive = true };
        _context.Languages.AddRange(langVi, langEn);

        var areaA = new Area
        {
            AreaId = 1,
            Name = "Khu Sư Tử & Thú Dữ",
            Description = "Phân khu động vật ăn thịt đầu bảng",
            Latitude = 10.7875m,
            Longitude = 106.7052m,
            RadiusMeters = 60m,
            Status = AreaStatus.Active
        };
        _context.Areas.Add(areaA);

        var speciesLion = new Species
        {
            SpeciesId = 1,
            Name = "Sư tử Châu Phi",
            ScientificName = "Panthera leo",
            Description = "Loài mèo lớn săn mồi đầu bảng",
            ConservationStatus = "VU - Sắp nguy cấp"
        };
        _context.Species.Add(speciesLion);

        var animalSimba = new Animal
        {
            AnimalId = 1,
            Name = "Sư tử Simba",
            SpeciesId = 1,
            AreaId = 1,
            Gender = AnimalGender.Male,
            Status = AnimalStatus.Active,
            HealthStatus = "Khỏe mạnh, sung mãn",
            Origin = "Serengeti, Tanzania",
            Description = "Simba có bờm đen sẫm uy lực"
        };
        _context.Animals.Add(animalSimba);

        var ticketType = new TicketType
        {
            TicketTypeId = 1,
            Name = "Vé Tiêu Chuẩn",
            Price = 120000m,
            DurationMinutes = 480,
            IsActive = true
        };
        _context.TicketTypes.Add(ticketType);

        var validTicket = new Ticket
        {
            TicketId = 1,
            TicketCode = "ZOO-VALID-01",
            TicketTypeId = 1,
            IssuedAt = DateTime.UtcNow,
            ValidFrom = DateTime.UtcNow.Date,
            ValidUntil = DateTime.UtcNow.Date.AddDays(1),
            Status = TicketStatus.Valid
        };

        var usedTicket = new Ticket
        {
            TicketId = 2,
            TicketCode = "ZOO-USED-02",
            TicketTypeId = 1,
            IssuedAt = DateTime.UtcNow.AddHours(-3),
            ValidFrom = DateTime.UtcNow.Date,
            ValidUntil = DateTime.UtcNow.Date.AddDays(1),
            Status = TicketStatus.Used,
            UsedAt = DateTime.UtcNow.AddHours(-2)
        };

        var expiredTicket = new Ticket
        {
            TicketId = 3,
            TicketCode = "ZOO-EXP-03",
            TicketTypeId = 1,
            IssuedAt = DateTime.UtcNow.AddDays(-5),
            ValidFrom = DateTime.UtcNow.AddDays(-5).Date,
            ValidUntil = DateTime.UtcNow.AddDays(-1).Date,
            Status = TicketStatus.Expired
        };

        _context.Tickets.AddRange(validTicket, usedTicket, expiredTicket);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // ==========================================
    // A. TEST DASHBOARD STATS
    // ==========================================
    [Fact]
    public async Task Dashboard_ShouldReturnAuthenticStatsFromDatabase()
    {
        var stats = await _dashboardService.GetStatsAsync();

        Assert.NotNull(stats);
        Assert.Equal(3, stats.TotalTickets);
        Assert.Equal(2, stats.ActiveTickets); // 1 Valid + 1 Used
        Assert.Equal(1, stats.ExpiredTickets);
        Assert.Equal(1, stats.TotalAnimals);
        Assert.Equal(1, stats.TotalSpecies);
        Assert.Equal(1, stats.TotalAreas);
        Assert.NotEmpty(stats.RecentHealthLogs);
        Assert.Equal("Sư tử Simba", stats.RecentHealthLogs[0].AnimalName);
    }

    // ==========================================
    // B. TEST TICKET VALIDATION & CAMERA QR FLOW
    // ==========================================
    [Fact]
    public async Task TicketValidation_WithValidCode_ShouldSucceedAndCreateSession()
    {
        var request = new ZooGuide.Application.DTOs.Ticket.ValidateTicketRequest
        {
            TicketCode = "ZOO-VALID-01"
        };

        var response = await _ticketService.ValidateAsync(request);

        Assert.True(response.Valid);
        Assert.NotNull(response.SessionId);
        Assert.Equal("ZOO-VALID-01", response.TicketCode);

        // Vé phải được cập nhật sang Used
        var updatedTicket = await _context.Tickets.FindAsync(1);
        Assert.Equal(TicketStatus.Used, updatedTicket!.Status);
        Assert.NotNull(updatedTicket.UsedAt);
    }

    [Fact]
    public async Task TicketValidation_WithNonExistentCode_ShouldReturnNotFoundError()
    {
        var request = new ZooGuide.Application.DTOs.Ticket.ValidateTicketRequest
        {
            TicketCode = "ZOO-DOES-NOT-EXIST"
        };

        var response = await _ticketService.ValidateAsync(request);

        Assert.False(response.Valid);
        Assert.Equal("TICKET_NOT_FOUND", response.ErrorCode);
    }

    [Fact]
    public async Task TicketValidation_WithUsedTicket_ShouldReject()
    {
        var request = new ZooGuide.Application.DTOs.Ticket.ValidateTicketRequest
        {
            TicketCode = "ZOO-USED-02"
        };

        var response = await _ticketService.ValidateAsync(request);

        Assert.False(response.Valid);
        Assert.Equal("TICKET_ALREADY_USED", response.ErrorCode);
    }

    [Fact]
    public async Task TicketValidation_WithExpiredTicket_ShouldReject()
    {
        var request = new ZooGuide.Application.DTOs.Ticket.ValidateTicketRequest
        {
            TicketCode = "ZOO-EXP-03"
        };

        var response = await _ticketService.ValidateAsync(request);

        Assert.False(response.Valid);
        Assert.Equal("TICKET_EXPIRED", response.ErrorCode);
    }

    // ==========================================
    // C. TEST TICKET SESSION LIFECYCLE
    // ==========================================
    [Fact]
    public async Task TicketSession_FullLifecycle_CreateVerifyRevoke()
    {
        // 1. Tạo session
        var session = await _ticketSessionService.CreateSessionAsync(1);
        Assert.NotNull(session);
        Assert.Equal(SessionStatus.Active, session.Status);

        // 2. Verify session hợp lệ
        var verified = await _ticketSessionService.GetValidSessionAsync(session.SessionId);
        Assert.NotNull(verified);
        Assert.Equal(session.SessionId, verified.SessionId);

        // 3. Quản trị viên thu hồi session
        bool revoked = await _ticketSessionService.RevokeSessionAsync(session.SessionId);
        Assert.True(revoked);

        // 4. Kiểm tra session sau khi bị thu hồi
        var checkAfterRevoke = await _ticketSessionService.GetValidSessionAsync(session.SessionId);
        Assert.Null(checkAfterRevoke); // Bị từ chối vì không còn Active
    }

    // ==========================================
    // D. TEST NARRATION & AUDIO MANAGEMENT
    // ==========================================
    [Fact]
    public async Task Narration_CreateUpdateStatusAndQuery_ShouldWorkAccurately()
    {
        // 1. Tạo bài thuyết minh
        var createDto = new CreateNarrationDto
        {
            AnimalId = 1,
            LanguageId = 1,
            Title = "Simba - Chúa Tể Thảo Nguyên",
            Content = "Sư tử Simba là cá thể dũng mãnh, sinh sống tại phân khu thú ăn thịt Hoàng Gia.",
            AudioUrl = "/assets/audio/simba_vi.mp3",
            DurationSeconds = 110,
            Status = "Draft"
        };

        var created = await _narrationService.CreateAsync(createDto);
        Assert.NotNull(created);
        Assert.Equal("Simba - Chúa Tể Thảo Nguyên", created.Title);
        Assert.Equal("Draft", created.Status);

        // 2. Duyệt & Xuất bản bài thuyết minh
        bool published = await _narrationService.UpdateStatusAsync(created.NarrationId, "Published");
        Assert.True(published);

        // 3. Truy vấn bài thuyết minh đã xuất bản theo con vật và ngôn ngữ
        var queryPublished = await _narrationService.GetByAnimalAndLanguageAsync(1, "vi");
        Assert.NotNull(queryPublished);
        Assert.Equal("Published", queryPublished.Status);

        // 4. Thêm audio file phụ
        var audioAdded = await _narrationService.AddAudioAsync(created.NarrationId, "/assets/audio/simba_vi_studio.mp3", "simba_vi_studio.mp3", "audio/mpeg", 115, 2500000);
        Assert.NotNull(audioAdded);

        // 5. Xóa bài thuyết minh
        bool deleted = await _narrationService.DeleteAsync(created.NarrationId);
        Assert.True(deleted);

        var verifyDeleted = await _narrationService.GetByIdAsync(created.NarrationId);
        Assert.Null(verifyDeleted);
    }

    [Fact]
    public async Task Narration_UploadRealAudioFile_ShouldSaveFileToDiskAndRecordInDatabase()
    {
        // 1. Tạo bài thuyết minh
        var createDto = new CreateNarrationDto
        {
            AnimalId = 1,
            LanguageId = 1,
            Title = "Thuyết minh thu âm thực tế",
            Content = "Nội dung thuyết minh có kèm file ghi âm phòng thu thực tế.",
            Status = "Published"
        };
        var narration = await _narrationService.CreateAsync(createDto);
        Assert.NotNull(narration);

        // 2. Chuẩn bị file audio nhị phân thực tế
        var controller = new NarrationsController(_narrationService, _auditLogService);
        var fakeAudioBytes = System.Text.Encoding.UTF8.GetBytes("ID3v2.4.0--REAL-MP3-AUDIO-STREAM-DATA--");
        using var stream = new MemoryStream(fakeAudioBytes);
        var formFile = new FormFile(stream, 0, fakeAudioBytes.Length, "file", "simba_studio_vocal.mp3")
        {
            Headers = new HeaderDictionary(),
            ContentType = "audio/mpeg"
        };

        // 3. Gọi endpoint UploadAudio của Controller
        var actionResult = await controller.UploadAudio(narration.NarrationId, formFile);
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<AudioResponseDto>>(okResult.Value);

        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Data);
        Assert.Equal("simba_studio_vocal.mp3", apiResponse.Data.FileName);
        Assert.Equal(fakeAudioBytes.Length, apiResponse.Data.FileSize);

        // 4. Kiểm tra file vật lý thực sự tồn tại trên ổ đĩa
        var relativeUrl = apiResponse.Data.FileUrl.TrimStart('/');
        var relativePath = relativeUrl.Replace('/', Path.DirectorySeparatorChar);
        var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);
        Assert.True(File.Exists(physicalPath), $"File vật lý không tồn tại tại: {physicalPath}");

        // 5. Kiểm tra bản ghi trong CSDL
        var audioInDb = await _context.Audios.FirstOrDefaultAsync(a => a.NarrationId == narration.NarrationId && a.FileName == "simba_studio_vocal.mp3");
        Assert.NotNull(audioInDb);
        Assert.Equal(fakeAudioBytes.Length, audioInDb.FileSize);

        // Dọn dẹp file test
        if (File.Exists(physicalPath))
        {
            File.Delete(physicalPath);
        }
    }

    // ==========================================
    // E. TEST CHATBOT WITH REAL DATABASE KNOWLEDGE
    // ==========================================
    [Fact]
    public async Task Chatbot_WhenQueryingSimba_ShouldReturnDatabaseAnimalDetails()
    {
        var request = new ChatbotQueryRequestDto
        {
            Message = "Sư tử Simba ăn gì và ở khu nào?"
        };

        var response = await _chatbotService.ProcessMessageAsync(request);

        Assert.True(response.FoundData);
        Assert.Equal("Animal", response.SourceType);
        Assert.Contains("Sư tử Simba", response.Reply);
        Assert.Contains("Khu Sư Tử & Thú Dữ", response.Reply);
    }

    [Fact]
    public async Task Chatbot_WhenQueryingZooHours_ShouldReturnAccurateHours()
    {
        var request = new ChatbotQueryRequestDto
        {
            Message = "Mấy giờ sở thú mở cửa?"
        };

        var response = await _chatbotService.ProcessMessageAsync(request);

        Assert.True(response.FoundData);
        Assert.Equal("Faq", response.SourceType);
        Assert.Contains("08:00", response.Reply);
        Assert.Contains("18:30", response.Reply);
    }

    [Fact]
    public async Task Chatbot_WhenQueryingUnknownTopic_MustNotHallucinate()
    {
        var request = new ChatbotQueryRequestDto
        {
            Message = "Có máy bay trực thăng hay tàu vũ trụ ở sở thú không?"
        };

        var response = await _chatbotService.ProcessMessageAsync(request);

        Assert.False(response.FoundData);
        Assert.Equal("NotFound", response.SourceType);
        Assert.Contains("chưa tìm thấy thông tin", response.Reply);
    }

    // ==========================================
    // F. TEST AUDIT LOG SERVICE
    // ==========================================
    [Fact]
    public void AuditLog_ShouldRecordAndRetrieveOperations()
    {
        _auditLogService.Log("DELETE", "Animal", "ANI-001", "Xóa cá thể thử nghiệm", true, "Admin");

        var logs = _auditLogService.GetLogs(10);
        Assert.NotEmpty(logs);
        Assert.Contains(logs, l => l.Action == "DELETE" && l.TargetEntity == "Animal");
    }

    // ==========================================
    // G. TEST SPECIES FILTERING
    // ==========================================
    [Fact]
    public async Task Species_WhenFilteredByName_ShouldReturnAccurateResults()
    {
        // Add tiger species to test Panthera scientific name match
        _context.Species.Add(new Species
        {
            SpeciesId = 2,
            Name = "Hổ Bengal",
            ScientificName = "Panthera tigris",
            ConservationStatus = "EN - Nguy cấp"
        });
        await _context.SaveChangesAsync();

        // 1. Search by Vietnamese name
        var lions = await _speciesService.GetAllAsync(search: "Sư tử");
        Assert.Single(lions);
        Assert.Equal("Sư tử Châu Phi", lions.First().Name);

        // 2. Search by Scientific name (matches Panthera leo and Panthera tigris)
        var pantheras = await _speciesService.GetAllAsync(search: "Panthera");
        Assert.Equal(2, pantheras.Count());

        // 3. Search non-existent
        var notFound = await _speciesService.GetAllAsync(search: "KhongTonTai12345");
        Assert.Empty(notFound);
    }

    [Fact]
    public async Task Species_WhenFilteredByConservationStatus_ShouldReturnAccurateResults()
    {
        _context.Species.AddRange(
            new Species { SpeciesId = 2, Name = "Hổ Bengal", ScientificName = "Panthera tigris", ConservationStatus = "EN - Nguy cấp" },
            new Species { SpeciesId = 3, Name = "Voi Châu Á", ScientificName = "Elephas maximus", ConservationStatus = "EN - Nguy cấp" },
            new Species { SpeciesId = 4, Name = "Kỳ giông Axolotl", ScientificName = "Ambystoma mexicanum", ConservationStatus = "CR - Cực kỳ nguy cấp" }
        );
        await _context.SaveChangesAsync();

        // Filter by Endangered ("EN - Nguy cấp")
        var endangered = await _speciesService.GetAllAsync(conservationStatus: "EN - Nguy cấp");
        Assert.Equal(2, endangered.Count());
        Assert.All(endangered, s => Assert.Equal("EN - Nguy cấp", s.ConservationStatus));

        // Combined filter: search "Voi" + conservationStatus "EN"
        var combined = await _speciesService.GetAllAsync(search: "Voi", conservationStatus: "EN - Nguy cấp");
        Assert.Single(combined);
        Assert.Equal("Voi Châu Á", combined.First().Name);

        // "all" returns all 4 species
        var all = await _speciesService.GetAllAsync(conservationStatus: "all");
        Assert.Equal(4, all.Count());
    }

    // ==========================================
    // H. TEST DASHBOARD TIME FILTERING
    // ==========================================
    [Fact]
    public async Task Dashboard_TimeFilter_ShouldPreserveCumulativeStatsAndFilterTimeMetrics()
    {
        // 1. Unfiltered (Toàn bộ thời gian)
        var initialStats = await _dashboardService.GetStatsAsync();
        Assert.Equal(1, initialStats.TotalSpecies);
        Assert.Equal(1, initialStats.TotalAnimals);
        Assert.Equal(1, initialStats.TotalAreas);
        Assert.Equal(3, initialStats.TotalTickets); // 3 seeded tickets (Valid, Used, Expired)

        // 2. Filtered for past period where no tickets were issued
        var pastStats = await _dashboardService.GetStatsAsync(
            fromDate: DateTime.UtcNow.AddYears(-5),
            toDate: DateTime.UtcNow.AddYears(-4)
        );

        // Cumulative stats MUST NOT change
        Assert.Equal(1, pastStats.TotalSpecies);
        Assert.Equal(1, pastStats.TotalAnimals);
        Assert.Equal(1, pastStats.TotalAreas);

        // Time-dependent metrics MUST be 0 for a period with no activity
        Assert.Equal(0, pastStats.TotalTickets);
        Assert.Equal(0, pastStats.ActiveTickets);
    }

    [Fact]
    public async Task DashboardController_WhenStartDateGreaterThanEndDate_ShouldReturnBadRequest()
    {
        var controller = new DashboardController(_dashboardService);
        var tomorrow = DateTime.UtcNow.AddDays(1);
        var yesterday = DateTime.UtcNow.AddDays(-1);

        var result = await controller.GetStats(fromDate: tomorrow, toDate: yesterday);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var apiResponse = Assert.IsAssignableFrom<ApiResponse<DashboardStatsDto>>(badRequest.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("Ngày bắt đầu không được lớn hơn ngày kết thúc", apiResponse.Message);
    }
}
