using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using QRCoder;
using Xunit;
using ZooGuide.Application.DTOs.Order;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Repositories;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class TicketEmailAndOnlineTrackingTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly TicketService _ticketService;
    private readonly TicketSessionService _ticketSessionService;
    private readonly OnlineUserTracker _onlineTracker;

    public TicketEmailAndOnlineTrackingTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuideEmailTrackerDb_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);

        var ticketRepo = new TicketRepository(_context);
        var sessionRepo = new TicketSessionRepository(_context);

        _ticketSessionService = new TicketSessionService(ticketRepo, sessionRepo);
        _ticketService = new TicketService(_context, _ticketSessionService);
        _onlineTracker = new OnlineUserTracker();

        SeedDatabase();
    }

    private void SeedDatabase()
    {
        var ticketType = new TicketType
        {
            TicketTypeId = 1,
            Name = "Vé Người Lớn Chuẩn",
            Price = 120000m,
            DurationMinutes = 480,
            IsActive = true
        };
        _context.TicketTypes.Add(ticketType);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _onlineTracker.ClearAll();
    }

    // =========================================================================
    // PHẦN B: KIỂM THỬ THEO DÕI NGƯỜI DÙNG ONLINE
    // =========================================================================

    [Fact]
    public void OnlineUsersCount_WhenNoOneConnected_ReturnsZero()
    {
        Assert.Equal(0, _onlineTracker.GetOnlineUsersCount());
        Assert.Equal(0, _onlineTracker.GetActiveConnectionsCount());
    }

    [Fact]
    public void OnlineUsersCount_WhenSingleBuyerConnects_ReturnsOne()
    {
        var isNew = _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-1-tab-1", isTicketBuyer: true);

        Assert.True(isNew);
        Assert.Equal(1, _onlineTracker.GetOnlineUsersCount());
        Assert.Equal(1, _onlineTracker.GetActiveConnectionsCount());
    }

    [Fact]
    public void OnlineUsersCount_WhenSameBuyerOpens3Tabs_ReturnsOneBuyerAndThreeConnections()
    {
        // 1 người mua vé mở 3 tabs trên cùng trình duyệt
        var isNew1 = _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-1-tab-1", isTicketBuyer: true);
        var isNew2 = _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-1-tab-2", isTicketBuyer: true);
        var isNew3 = _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-1-tab-3", isTicketBuyer: true);

        Assert.True(isNew1);
        Assert.False(isNew2);
        Assert.False(isNew3);

        // Số người mua vé online vẫn CHÍNH XÁC là 1 người
        Assert.Equal(1, _onlineTracker.GetOnlineUsersCount());
        // Tổng số kết nối tab là 3
        Assert.Equal(3, _onlineTracker.GetActiveConnectionsCount());
    }

    [Fact]
    public void OnlineUsersCount_WhenFourDifferentBuyersConnect_ReturnsFour()
    {
        // 4 người mua vé truy cập bằng 4 tài khoản/email khác nhau
        _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-1", isTicketBuyer: true);
        _onlineTracker.RegisterConnection("buyer:user2@gmail.com", "conn-2", isTicketBuyer: true);
        _onlineTracker.RegisterConnection("buyer:user3@gmail.com", "conn-3", isTicketBuyer: true);
        _onlineTracker.RegisterConnection("buyer:user4@gmail.com", "conn-4", isTicketBuyer: true);

        Assert.Equal(4, _onlineTracker.GetOnlineUsersCount());
        Assert.Equal(4, _onlineTracker.GetActiveConnectionsCount());
    }

    [Fact]
    public void OnlineUsersCount_WhenBuyerClosesTabs_DecrementsOnlyWhenLastTabClosed()
    {
        // Người mua vé 1 mở 2 tabs
        _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-1", isTicketBuyer: true);
        _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-2", isTicketBuyer: true);
        // Người mua vé 2 mở 1 tab
        _onlineTracker.RegisterConnection("buyer:user2@gmail.com", "conn-3", isTicketBuyer: true);

        Assert.Equal(2, _onlineTracker.GetOnlineUsersCount());

        // Người 1 đóng tab 1 -> vẫn còn tab 2 -> Vẫn tính 2 người online
        var wentOffline1 = _onlineTracker.RemoveConnection("buyer:user1@gmail.com", "conn-1");
        Assert.False(wentOffline1);
        Assert.Equal(2, _onlineTracker.GetOnlineUsersCount());
        Assert.Equal(2, _onlineTracker.GetActiveConnectionsCount());

        // Người 1 đóng tab 2 -> không còn tab nào -> Người 1 offline hoàn toàn
        var wentOffline2 = _onlineTracker.RemoveConnection("buyer:user1@gmail.com", "conn-2");
        Assert.True(wentOffline2);
        Assert.Equal(1, _onlineTracker.GetOnlineUsersCount());
        Assert.Equal(1, _onlineTracker.GetActiveConnectionsCount());

        // Người 2 đóng tab cuối -> Hệ thống trở về 0 người
        var wentOffline3 = _onlineTracker.RemoveConnection("buyer:user2@gmail.com", "conn-3");
        Assert.True(wentOffline3);
        Assert.Equal(0, _onlineTracker.GetOnlineUsersCount());
    }

    [Fact]
    public void OnlineUsersCount_WhenBuyerReconnects_DoesNotDoubleCount()
    {
        _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-old", isTicketBuyer: true);
        Assert.Equal(1, _onlineTracker.GetOnlineUsersCount());

        // Reconnect: đăng ký connection mới cho cùng email người mua
        _onlineTracker.RegisterConnection("buyer:user1@gmail.com", "conn-new", isTicketBuyer: true);
        Assert.Equal(1, _onlineTracker.GetOnlineUsersCount());

        _onlineTracker.RemoveConnection("buyer:user1@gmail.com", "conn-old");
        Assert.Equal(1, _onlineTracker.GetOnlineUsersCount());
    }

    // =========================================================================
    // PHẦN A: KIỂM THỬ TẠO MÃ QR & GỬI EMAIL VÉ
    // =========================================================================

    [Fact]
    public void QrCodeGeneration_GeneratesValidPngBytesForTicketCode()
    {
        var testTicketCode = "ZG-20261024-ABC12345";

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(testTicketCode, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var qrBytes = qrCode.GetGraphic(16);

        Assert.NotNull(qrBytes);
        Assert.NotEmpty(qrBytes);
        // PNG header signature bytes: 0x89, 0x50, 0x4E, 0x47
        Assert.Equal(0x89, qrBytes[0]);
        Assert.Equal(0x50, qrBytes[1]);
        Assert.Equal(0x4E, qrBytes[2]);
        Assert.Equal(0x47, qrBytes[3]);
    }

    [Fact]
    public async Task EmailService_WhenNotConfigured_ReturnsSmtpNotConfiguredResult()
    {
        var emptyConfig = new ConfigurationBuilder().Build();
        var emailService = new SmtpEmailService(emptyConfig, NullLogger<SmtpEmailService>.Instance);

        var order = new TicketOrder
        {
            OrderId = 1,
            OrderCode = "ZG-20261024-111111",
            CustomerName = "Nguyễn Văn Test",
            CustomerEmail = "test@example.com",
            CustomerPhone = "0900000000",
            TicketTypeId = 1,
            Quantity = 1,
            TotalAmount = 120000m,
            PaymentStatus = PaymentStatus.Paid
        };

        var ticket = new Ticket
        {
            TicketId = 1,
            TicketCode = "ZG-20261024-TICKET1",
            TicketTypeId = 1,
            OrderId = 1,
            ValidFrom = DateTime.UtcNow,
            ValidUntil = DateTime.UtcNow.AddHours(8),
            Status = TicketStatus.Valid
        };

        var result = await emailService.SendTicketConfirmationEmailAsync(order, new[] { ticket });

        Assert.False(result.Success);
        Assert.Equal("SMTP_NOT_CONFIGURED", result.ErrorCode);
        Assert.Contains("EMAIL_SMTP_USERNAME", result.Message);
    }

    [Fact]
    public async Task EmailService_WhenInvalidRecipientEmail_ReturnsInvalidEmailResult()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Email:SmtpHost"] = "smtp.gmail.com",
            ["Email:SmtpPort"] = "587",
            ["Email:SmtpUsername"] = "sender@gmail.com",
            ["Email:SmtpPassword"] = "apppassword12345"
        }).Build();

        var emailService = new SmtpEmailService(config, NullLogger<SmtpEmailService>.Instance);

        var order = new TicketOrder
        {
            OrderId = 1,
            OrderCode = "ZG-20261024-222222",
            CustomerName = "Nguyễn Văn Test",
            CustomerEmail = "invalid-email-address", // Sai định dạng
            PaymentStatus = PaymentStatus.Paid
        };

        var ticket = new Ticket
        {
            TicketId = 1,
            TicketCode = "ZG-20261024-TICKET2",
            Status = TicketStatus.Valid
        };

        var result = await emailService.SendTicketConfirmationEmailAsync(order, new[] { ticket });

        Assert.False(result.Success);
        Assert.Equal("INVALID_EMAIL", result.ErrorCode);
    }

    [Fact]
    public async Task OrderService_ResendTicketEmail_WhenOrderNotPaid_ThrowsInvalidOperationException()
    {
        var orderService = new OrderService(_context, _ticketService);

        var order = new TicketOrder
        {
            OrderCode = "ZG-20261024-UNPAID",
            CustomerName = "Khách Hàng",
            CustomerEmail = "khach@gmail.com",
            CustomerPhone = "0912345678",
            TicketTypeId = 1,
            Quantity = 1,
            UnitPrice = 120000m,
            TotalAmount = 120000m,
            PaymentStatus = PaymentStatus.Pending, // Chưa thanh toán
            PaymentDescription = "ZG999999",
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };
        _context.TicketOrders.Add(order);
        await _context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            orderService.ResendTicketEmailAsync("ZG-20261024-UNPAID"));
    }

    [Fact]
    public async Task OrderService_SimulatePayment_WhenEmailFails_DoesNotDeleteOrderOrTickets()
    {
        // Mock email service trả về thất bại (ví dụ SMTP chưa cấu hình)
        var failingEmailService = new SmtpEmailService(
            new ConfigurationBuilder().Build(), 
            NullLogger<SmtpEmailService>.Instance);

        var orderService = new OrderService(_context, _ticketService, failingEmailService);

        var createReq = new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 2,
            CustomerName = "Trần Thị Thanh",
            CustomerEmail = "thanh@gmail.com",
            CustomerPhone = "0987654321"
        };
        var createdOrder = await orderService.CreateOrderAsync(createReq);

        // Thanh toán sandbox
        var paidOrder = await orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = createdOrder.OrderCode
        });

        // 1. Đơn hàng vẫn được đánh dấu Paid
        Assert.Equal(PaymentStatus.Paid, paidOrder.PaymentStatus);
        // 2. Vé vẫn được cấp đầy đủ (2 vé)
        Assert.Equal(2, paidOrder.IssuedTickets.Count);
        // 3. Luồng mua vé đã ngắt gửi email, không báo giả thành công
        Assert.Null(paidOrder.EmailSent);
        // 4. Cơ sở dữ liệu vẫn lưu đầy đủ đơn hàng và vé
        var dbOrder = await _context.TicketOrders.Include(o => o.Tickets).FirstOrDefaultAsync(o => o.OrderCode == createdOrder.OrderCode);
        Assert.NotNull(dbOrder);
        Assert.Equal(2, dbOrder.Tickets.Count);
    }
}
