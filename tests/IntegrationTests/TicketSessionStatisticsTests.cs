using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class TicketSessionStatisticsTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly DashboardService _dashboardService;

    public TicketSessionStatisticsTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuideSessionStatsTest_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);
        _dashboardService = new DashboardService(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GetStats_ShouldOnlyCountStrictlyActiveUnexpiredUnendedSessions_WithoutDateFilter()
    {
        var now = DateTime.UtcNow;

        // 1. Session hợp lệ đang hoạt động: Status=Active, EndedAt=null, ExpiredAt in future (+2 hours)
        var validActiveSession = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = 1,
            StartedAt = now.AddHours(-1),
            ExpiredAt = now.AddHours(2),
            EndedAt = null,
            Status = SessionStatus.Active
        };

        // 2. Session đã hết hạn nhưng status vẫn là Active trong DB (chưa chạy job đổi status)
        var expiredUnupdatedSession = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = 2,
            StartedAt = now.AddHours(-5),
            ExpiredAt = now.AddMinutes(-10), // Hết hạn 10 phút trước!
            EndedAt = null,
            Status = SessionStatus.Active
        };

        // 3. Session đã kết thúc (Status=Ended, EndedAt != null)
        var endedSession = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = 3,
            StartedAt = now.AddHours(-2),
            ExpiredAt = now.AddHours(2),
            EndedAt = now.AddMinutes(-30),
            Status = SessionStatus.Ended
        };

        // 4. Session bị thu hồi (Revoked)
        var revokedSession = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = 4,
            StartedAt = now.AddHours(-3),
            ExpiredAt = now.AddHours(1),
            EndedAt = now.AddMinutes(-45),
            Status = SessionStatus.Revoked
        };

        _context.TicketSessions.AddRange(validActiveSession, expiredUnupdatedSession, endedSession, revokedSession);
        await _context.SaveChangesAsync();

        // Act: lấy stats không truyền date filter
        var stats = await _dashboardService.GetStatsAsync();

        // Assert: Chỉ duy nhất 1 session hợp lệ được tính là Active!
        Assert.Equal(1, stats.ActiveSessions);
    }

    [Fact]
    public async Task GetStats_ShouldApplyDateFilterCorrectly_WhileExcludingExpiredSessions()
    {
        var now = DateTime.UtcNow;

        // Session hợp lệ trong khoảng thời gian lọc (hôm nay)
        var validSessionToday = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = 10,
            StartedAt = now.AddHours(-1),
            ExpiredAt = now.AddHours(3),
            EndedAt = null,
            Status = SessionStatus.Active
        };

        // Session hợp lệ ngoài khoảng lọc (3 ngày trước)
        var validSessionPast = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = 11,
            StartedAt = now.AddDays(-3),
            ExpiredAt = now.AddDays(-2),
            EndedAt = null,
            Status = SessionStatus.Active
        };

        // Session trong ngày nhưng đã hết hạn
        var expiredSessionToday = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = 12,
            StartedAt = now.AddHours(-3),
            ExpiredAt = now.AddMinutes(-5),
            EndedAt = null,
            Status = SessionStatus.Active
        };

        _context.TicketSessions.AddRange(validSessionToday, validSessionPast, expiredSessionToday);
        await _context.SaveChangesAsync();

        // Lọc trong 24 giờ qua
        var fromDate = now.AddHours(-12);
        var toDate = now.AddHours(1);

        var stats = await _dashboardService.GetStatsAsync(fromDate, toDate);

        // Chỉ có validSessionToday là thỏa mãn (StartedAt trong khoảng và chưa hết hạn)
        Assert.Equal(1, stats.ActiveSessions);
    }
}
