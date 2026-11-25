using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.Application.Services;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Repositories;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class TicketSessionStatisticsTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly DashboardService _dashboardService;
    private readonly DeviceTrackingService _deviceTrackingService;
    private readonly ZooGuide.Application.Services.TicketSessionService _ticketSessionService;

    public TicketSessionStatisticsTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuideSessionStatsTest_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);
        _dashboardService = new DashboardService(_context);
        _deviceTrackingService = new DeviceTrackingService(_context);
        _ticketSessionService = new ZooGuide.Application.Services.TicketSessionService(
            new TicketRepository(_context),
            new TicketSessionRepository(_context));
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

    private async Task<Ticket> SeedTicketAsync(int ticketId, string code, string customerName = "Khách Tham Quan")
    {
        if (!await _context.TicketTypes.AnyAsync(tt => tt.TicketTypeId == 1))
        {
            _context.TicketTypes.Add(new TicketType
            {
                TicketTypeId = 1,
                Name = "Vé Tiêu Chuẩn",
                Price = 60000m,
                DurationMinutes = 480,
                IsActive = true
            });
        }

        var order = new TicketOrder
        {
            OrderId = 1000 + ticketId,
            OrderCode = $"ZG-ORD-{ticketId}",
            CustomerName = customerName,
            CustomerEmail = $"guest{ticketId}@example.com",
            TicketTypeId = 1,
            Quantity = 1,
            UnitPrice = 60000m,
            TotalAmount = 60000m,
            PaymentStatus = PaymentStatus.Paid,
            PaidAt = DateTime.UtcNow
        };
        _context.TicketOrders.Add(order);

        var ticket = new Ticket
        {
            TicketId = ticketId,
            TicketCode = code,
            TicketTypeId = 1,
            OrderId = order.OrderId,
            Status = TicketStatus.Used,
            IssuedAt = DateTime.UtcNow,
            ValidFrom = DateTime.UtcNow.AddHours(-1),
            ValidUntil = DateTime.UtcNow.AddHours(8)
        };
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    [Fact]
    public async Task OneDevice_OneValidSession_CountsOneDeviceAndOneActiveSession()
    {
        await _deviceTrackingService.RecordHeartbeatAsync("dev-single-01", "Chrome", "10.0.1.1");
        var ticket = await SeedTicketAsync(101, "ZG-S1-001", "Nguyễn Văn A");
        var session = await _ticketSessionService.CreateSessionAsync(ticket.TicketId);

        var stats = await _dashboardService.GetStatsAsync();
        var allSessions = (await _ticketSessionService.GetAllSessionsAsync()).ToList();

        Assert.Equal(1, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(1, stats.ActiveSessions);
        Assert.Single(allSessions);
        Assert.Equal(session.SessionId.ToString(), allSessions[0].SessionId);
        Assert.Equal("Active", allSessions[0].Status);
        Assert.True(allSessions[0].IsActive);
        Assert.Equal("Nguyễn Văn A", allSessions[0].CustomerName);
    }

    [Fact]
    public async Task OneDevice_TwoValidSessions_CountsOneDeviceAndTwoActiveSessionsIndependently()
    {
        await _deviceTrackingService.RecordHeartbeatAsync("dev-shared-01", "Safari", "10.0.1.2");
        var t1 = await SeedTicketAsync(201, "ZG-S2-001", "Trần Thị B");
        var t2 = await SeedTicketAsync(202, "ZG-S2-002", "Trần Thị B (Bé)");
        await _ticketSessionService.CreateSessionAsync(t1.TicketId);
        await _ticketSessionService.CreateSessionAsync(t2.TicketId);

        var stats = await _dashboardService.GetStatsAsync();
        var activeSessions = (await _ticketSessionService.GetAllSessionsAsync(status: "Active")).ToList();

        Assert.Equal(1, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(2, stats.ActiveSessions);
        Assert.Equal(2, activeSessions.Count);
    }

    [Fact]
    public async Task TwoDevices_ThreeValidSessions_CountsTwoDevicesAndThreeActiveSessions()
    {
        await _deviceTrackingService.RecordHeartbeatAsync("dev-pair-01", "Chrome", "10.0.1.3");
        await _deviceTrackingService.RecordHeartbeatAsync("dev-pair-02", "Safari", "10.0.1.4");
        var t1 = await SeedTicketAsync(301, "ZG-S3-001", "Khách 1");
        var t2 = await SeedTicketAsync(302, "ZG-S3-002", "Khách 2");
        var t3 = await SeedTicketAsync(303, "ZG-S3-003", "Khách 3");
        await _ticketSessionService.CreateSessionAsync(t1.TicketId);
        await _ticketSessionService.CreateSessionAsync(t2.TicketId);
        await _ticketSessionService.CreateSessionAsync(t3.TicketId);

        var stats = await _dashboardService.GetStatsAsync();
        var activeSessions = (await _ticketSessionService.GetAllSessionsAsync(status: "Active")).ToList();

        Assert.Equal(2, stats.OnlineDevicesCombined1MinCount);
        Assert.Equal(3, stats.ActiveSessions);
        Assert.Equal(3, activeSessions.Count);
    }

    [Fact]
    public async Task GetAllSessions_ExcludesExpiredEndedRevokedFromActive_AndResolvesStaleExpiredStatus()
    {
        var now = DateTime.UtcNow;
        var t1 = await SeedTicketAsync(401, "ZG-ACT-001");
        var t2 = await SeedTicketAsync(402, "ZG-EXP-STALE");
        var t3 = await SeedTicketAsync(403, "ZG-END-001");
        var t4 = await SeedTicketAsync(404, "ZG-REV-001");
        var t5 = await SeedTicketAsync(405, "ZG-EXP-DB");

        _context.TicketSessions.AddRange(
            new TicketSession { SessionId = Guid.NewGuid(), TicketId = t1.TicketId, StartedAt = now.AddMinutes(-30), ExpiredAt = now.AddHours(3), EndedAt = null, Status = SessionStatus.Active },
            // Stale DB status = Active but ExpiredAt already in the past!
            new TicketSession { SessionId = Guid.NewGuid(), TicketId = t2.TicketId, StartedAt = now.AddHours(-9), ExpiredAt = now.AddMinutes(-15), EndedAt = null, Status = SessionStatus.Active },
            new TicketSession { SessionId = Guid.NewGuid(), TicketId = t3.TicketId, StartedAt = now.AddHours(-2), ExpiredAt = now.AddHours(2), EndedAt = now.AddMinutes(-20), Status = SessionStatus.Ended },
            new TicketSession { SessionId = Guid.NewGuid(), TicketId = t4.TicketId, StartedAt = now.AddHours(-1), ExpiredAt = now.AddHours(3), EndedAt = now.AddMinutes(-10), Status = SessionStatus.Revoked },
            new TicketSession { SessionId = Guid.NewGuid(), TicketId = t5.TicketId, StartedAt = now.AddHours(-10), ExpiredAt = now.AddHours(-2), EndedAt = now.AddHours(-2), Status = SessionStatus.Expired }
        );
        await _context.SaveChangesAsync();

        var allSessions = (await _ticketSessionService.GetAllSessionsAsync()).ToList();
        var activeOnly = (await _ticketSessionService.GetAllSessionsAsync(status: "Active")).ToList();
        var expiredOnly = (await _ticketSessionService.GetAllSessionsAsync(status: "Expired")).ToList();
        var stats = await _dashboardService.GetStatsAsync();

        Assert.Equal(5, allSessions.Count);
        Assert.Single(activeOnly);
        Assert.Equal("ZG-ACT-001", activeOnly[0].TicketCode);
        Assert.Equal(stats.ActiveSessions, activeOnly.Count);

        var staleExpired = allSessions.Single(s => s.TicketCode == "ZG-EXP-STALE");
        Assert.Equal("Expired", staleExpired.Status);
        Assert.False(staleExpired.IsActive);
        Assert.Equal(2, expiredOnly.Count);
    }

    [Fact]
    public async Task EndSessionAndRevokeSession_SetProperStatusesAndDecrementActiveCount()
    {
        var t1 = await SeedTicketAsync(501, "ZG-EXIT-001");
        var t2 = await SeedTicketAsync(502, "ZG-REVOKE-002");
        var s1 = await _ticketSessionService.CreateSessionAsync(t1.TicketId);
        var s2 = await _ticketSessionService.CreateSessionAsync(t2.TicketId);

        Assert.Equal(2, (await _dashboardService.GetStatsAsync()).ActiveSessions);

        // Visitor exits session 1 -> Ended
        var endedOk = await _ticketSessionService.EndSessionAsync(s1.SessionId);
        Assert.True(endedOk);
        Assert.Equal(1, (await _dashboardService.GetStatsAsync()).ActiveSessions);
        Assert.Null(await _ticketSessionService.GetValidSessionAsync(s1.SessionId));

        // Admin revokes session 2 -> Revoked
        var revokedOk = await _ticketSessionService.RevokeSessionAsync(s2.SessionId);
        Assert.True(revokedOk);
        Assert.Equal(0, (await _dashboardService.GetStatsAsync()).ActiveSessions);
        Assert.Null(await _ticketSessionService.GetValidSessionAsync(s2.SessionId));

        var allSessions = (await _ticketSessionService.GetAllSessionsAsync()).ToList();
        Assert.Equal("Ended", allSessions.Single(x => x.SessionId == s1.SessionId.ToString()).Status);
        Assert.Equal("Revoked", allSessions.Single(x => x.SessionId == s2.SessionId.ToString()).Status);
        Assert.All(allSessions, x =>
        {
            Assert.False(x.IsActive);
            Assert.NotNull(x.EndedAtUtc);
        });
    }
}
