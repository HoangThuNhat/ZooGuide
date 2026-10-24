using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.API.Controllers;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.DTOs.Order;
using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Repositories;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class OrderAndPaymentIntegrationTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly TicketService _ticketService;
    private readonly TicketSessionService _ticketSessionService;
    private readonly OrderService _orderService;

    public OrderAndPaymentIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuideOrderTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);

        var ticketRepo = new TicketRepository(_context);
        var sessionRepo = new TicketSessionRepository(_context);

        _ticketSessionService = new TicketSessionService(ticketRepo, sessionRepo);
        _ticketService = new TicketService(_context, _ticketSessionService);
        _orderService = new OrderService(_context, _ticketService);

        SeedDatabase();
    }

    private void SeedDatabase()
    {
        var adultTicketType = new TicketType
        {
            TicketTypeId = 1,
            Name = "Vé Người Lớn (Adult Pass)",
            Price = 120000m,
            DurationMinutes = 480,
            IsActive = true
        };

        var childTicketType = new TicketType
        {
            TicketTypeId = 2,
            Name = "Vé Trẻ Em (Child Pass)",
            Price = 60000m,
            DurationMinutes = 480,
            IsActive = true
        };

        _context.TicketTypes.AddRange(adultTicketType, childTicketType);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // =========================================================================
    // 1. KIỂM THỬ TẠO ĐƠN HÀNG & BẢO MẬT GIÁ TỪ SERVER (YÊU CẦU 6.2)
    // =========================================================================
    [Fact]
    public async Task CreateOrder_ShouldCalculatePriceFromServerAndGenerateValidQR()
    {
        var request = new CreateOrderRequest
        {
            TicketTypeId = 1, // Adult ticket: 120,000 VND
            Quantity = 3,
            CustomerName = "Nguyễn Văn Thử Nghiệm",
            CustomerEmail = "test@zooguide.vn",
            CustomerPhone = "0901234567"
        };

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order);
        Assert.Equal(120000m, order.UnitPrice);
        Assert.Equal(360000m, order.TotalAmount); // 120k * 3 = 360k
        Assert.Equal(PaymentStatus.Pending, order.PaymentStatus);
        Assert.StartsWith("ZG-", order.OrderCode);
        Assert.StartsWith("ZG", order.PaymentDescription);
        Assert.NotNull(order.QrCodeUrl);
        Assert.Contains("vietqr.io", order.QrCodeUrl);
        Assert.Contains("360000", order.QrCodeUrl);
        Assert.Empty(order.IssuedTickets); // Chưa thanh toán -> Chưa có vé
    }

    // =========================================================================
    // 2. KIỂM THỬ XÁC MINH WEBHOOK VÀ TỰ ĐỘNG CẤP VÉ AN TOÀN (YÊU CẦU 6.3 & 6.4)
    // =========================================================================
    [Fact]
    public async Task PaymentWebhook_WithMatchingContentAndAmount_ShouldMarkPaidAndIssueTickets()
    {
        // 1. Tạo đơn hàng
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 2, // Child: 60,000 VND
            Quantity = 2,
            CustomerName = "Trần Thị Lan",
            CustomerEmail = "lan.tran@gmail.com",
            CustomerPhone = "0912345678"
        });

        // 2. Webhook chuyển khoản ngân hàng hợp lệ
        var webhookPayload = new PaymentWebhookPayload
        {
            TransferAmount = 120000m,
            Content = $"Chuyen khoan {order.PaymentDescription} thanh toan ve Thao Cam Vien",
            ReferenceCode = "FT20261022889900"
        };

        var webhookResult = await _orderService.ProcessPaymentWebhookAsync(webhookPayload);
        Assert.True(webhookResult);

        // 3. Kiểm tra trạng thái đơn sau webhook
        var updatedOrder = await _orderService.GetByOrderCodeAsync(order.OrderCode);
        Assert.NotNull(updatedOrder);
        Assert.Equal(PaymentStatus.Paid, updatedOrder.PaymentStatus);
        Assert.NotNull(updatedOrder.PaidAt);
        Assert.Equal("FT20261022889900", updatedOrder.TransactionReference);

        // 4. Kiểm tra mã vé tự động cấp
        Assert.Equal(2, updatedOrder.IssuedTickets.Count);
        foreach (var ticket in updatedOrder.IssuedTickets)
        {
            Assert.StartsWith("ZG-", ticket.TicketCode);
            Assert.Equal(TicketStatus.Valid, ticket.Status);
            Assert.True(ticket.ValidUntil > DateTime.UtcNow);
        }
    }

    // =========================================================================
    // 3. KIỂM THỬ IDEMPOTENCY: WEBHOOK LẶP LẠI KHÔNG SINH THỪA VÉ (YÊU CẦU 6.3)
    // =========================================================================
    [Fact]
    public async Task PaymentWebhook_DuplicateCalls_MustBeIdempotentAndNotDuplicateTickets()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 1,
            CustomerName = "Hoàng Kim",
            CustomerEmail = "kim.hoang@gmail.com",
            CustomerPhone = "0987654321"
        });

        var payload = new PaymentWebhookPayload
        {
            TransferAmount = 120000m,
            Content = $"THANH TOAN {order.PaymentDescription}",
            ReferenceCode = "REF-SAME-IDEMPOTENT"
        };

        // Lần 1
        var call1 = await _orderService.ProcessPaymentWebhookAsync(payload);
        Assert.True(call1);

        // Lần 2 (Webhook lặp lại do mạng retry)
        var call2 = await _orderService.ProcessPaymentWebhookAsync(payload);
        Assert.True(call2);

        // Tổng số vé phát hành cho đơn hàng này vẫn chỉ chính xác là 1 vé
        var ticketsInDb = await _context.Tickets.Where(t => t.OrderId == order.OrderId).ToListAsync();
        Assert.Single(ticketsInDb);
    }

    // =========================================================================
    // 4. KIỂM THỬ XỬ LÝ GIAO DỊCH THIẾU TIỀN (UNDERPAID) (YÊU CẦU 6.3)
    // =========================================================================
    [Fact]
    public async Task PaymentWebhook_WhenTransferAmountInsufficient_ShouldRejectAndNotIssueTickets()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1, // 120,000 VND
            Quantity = 1,
            CustomerName = "Người Chuyển Thiếu",
            CustomerEmail = "short@test.com",
            CustomerPhone = "0933333333"
        });

        var payload = new PaymentWebhookPayload
        {
            TransferAmount = 50000m, // Chuyển thiếu (chỉ 50k thay vì 120k)
            Content = $"Thanh toan {order.PaymentDescription}",
            ReferenceCode = "REF-UNDERPAID"
        };

        var result = await _orderService.ProcessPaymentWebhookAsync(payload);
        Assert.False(result);

        var orderAfter = await _orderService.GetByOrderCodeAsync(order.OrderCode);
        Assert.Equal(PaymentStatus.Failed, orderAfter!.PaymentStatus);
        Assert.Empty(orderAfter.IssuedTickets); // Tuyệt đối không phát hành vé
    }

    // =========================================================================
    // 5. KIỂM THỬ SIMULATE SANDBOX PAYMENT (YÊU CẦU 6.1 & 9.3)
    // =========================================================================
    [Fact]
    public async Task SimulateSandboxPayment_ShouldSucceedAndUnlockTickets()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 2,
            Quantity = 1,
            CustomerName = "Khách Hàng Sandbox",
            CustomerEmail = "sandbox@zooguide.vn",
            CustomerPhone = "0944444444"
        });

        var result = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = order.OrderCode,
            Amount = 60000m
        });

        Assert.Equal(PaymentStatus.Paid, result.PaymentStatus);
        Assert.Single(result.IssuedTickets);
        Assert.Equal(TicketStatus.Valid, result.IssuedTickets[0].Status);

        // Mã vé phát hành phải xác thực và mở khóa được phiên tham quan
        var validateResult = await _ticketService.ValidateAsync(new ValidateTicketRequest
        {
            TicketCode = result.IssuedTickets[0].TicketCode
        });

        Assert.True(validateResult.Valid);
        Assert.NotNull(validateResult.SessionId);
    }

    // =========================================================================
    // 6. KIỂM THỬ KHÔI PHỤC PHÁT HÀNH VÉ THỦ CÔNG BỞI ADMIN
    // =========================================================================
    [Fact]
    public async Task TicketService_AdminManualCreate_ShouldIssueValidTicketWithAdminOrder()
    {
        var manualRequest = new TicketCreateRequest
        {
            TicketTypeId = 1,
            CustomerName = "Khách Đoàn Tham Quan",
            CustomerEmail = "doan@example.com",
            CustomerPhone = "0909123456",
            Note = "Vé phát hành sự kiện tại quầy",
            ValidFrom = DateTime.UtcNow,
            ValidUntil = DateTime.UtcNow.AddDays(1)
        };

        var ticket = await _ticketService.CreateAsync(manualRequest);

        Assert.NotNull(ticket);
        Assert.StartsWith("ZG-", ticket.TicketCode);
        Assert.Equal(TicketStatus.Valid, ticket.Status);
        Assert.NotNull(ticket.OrderId);
        Assert.Equal("Khách Đoàn Tham Quan", ticket.CustomerName);

        // Kiểm tra đơn hàng quản trị được tạo tương ứng
        var order = await _context.TicketOrders.FindAsync(ticket.OrderId);
        Assert.NotNull(order);
        Assert.Equal(PaymentStatus.Paid, order.PaymentStatus);
        Assert.Equal("AdminDirect", order.PaymentMethod);
    }

    [Fact]
    public async Task TicketsController_CreateEndpoint_ShouldReturnCreatedResult()
    {
        var controller = new TicketsController(_ticketService, _ticketSessionService);

        var request = new TicketCreateRequest
        {
            TicketTypeId = 1,
            CustomerName = "Khách Quầy Lẻ",
            ValidFrom = DateTime.UtcNow,
            ValidUntil = DateTime.UtcNow.AddDays(1)
        };

        var result = await controller.Create(request);

        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(StatusCodes.Status201Created, createdAtResult.StatusCode);
    }

    // =========================================================================
    // 7. KIỂM THỬ ADMIN CẬP NHẬT TRẠNG THÁI VÉ KHÔNG LÀM SAI LỆCH THANH TOÁN (YÊU CẦU 5.2 & 5.3)
    // =========================================================================
    [Fact]
    public async Task TicketService_AdminUpdateStatus_ShouldUpdateTicketStatusSafely()
    {
        // 1. Tạo đơn và cấp vé hợp lệ
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 1,
            CustomerName = "Admin Quản Lý Vé",
            CustomerEmail = "admin.mg@zooguide.vn",
            CustomerPhone = "0977777777"
        });
        var paidOrder = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest { OrderCode = order.OrderCode });
        var ticket = paidOrder.IssuedTickets.First();

        // 2. Admin cập nhật trạng thái vé sang Locked (Khóa vé)
        var updated = await _ticketService.UpdateStatusAsync(ticket.TicketId, TicketStatus.Locked);
        Assert.NotNull(updated);
        Assert.Equal(TicketStatus.Locked, updated.Status);

        // 3. Đơn hàng và số liệu thanh toán phải được giữ nguyên toàn vẹn
        var checkOrder = await _orderService.GetByOrderCodeAsync(order.OrderCode);
        Assert.Equal(PaymentStatus.Paid, checkOrder!.PaymentStatus);
        Assert.Equal(order.TotalAmount, checkOrder.TotalAmount);
    }

    // =========================================================================
    // 8. KIỂM THỬ PHÂN BIỆT VÉ ĐƯỢC XÓA VÀ VÉ KHÔNG ĐƯỢC XÓA CỨNG
    // =========================================================================
    [Fact]
    public async Task TicketService_DeletePaidOfficialTicket_MustThrowInvalidOperationException()
    {
        // 1. Tạo đơn hàng và thanh toán thành công
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 1,
            CustomerName = "Khách Đã Mua Vé",
            CustomerEmail = "khach.muave@example.com",
            CustomerPhone = "0911223344"
        });
        var paidOrder = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest { OrderCode = order.OrderCode });
        var ticket = paidOrder.IssuedTickets.First();

        // 2. Cố gắng xóa cứng vé đã thanh toán phát hành chính thức -> Phải từ chối bảo vệ giao dịch
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _ticketService.DeleteAsync(ticket.TicketId)
        );

        Assert.Contains("Không thể xóa cứng vé đã thanh toán", ex.Message);
    }

    [Fact]
    public async Task TicketService_CancelTicket_ShouldPreventCheckIn()
    {
        // 1. Phát hành vé
        var ticket = await _ticketService.CreateAsync(new TicketCreateRequest
        {
            TicketTypeId = 1,
            CustomerName = "Khách Hủy Vé"
        });

        // 2. Chuyển trạng thái sang Hủy vé (Cancelled)
        var cancelled = await _ticketService.UpdateStatusAsync(ticket.TicketId, TicketStatus.Cancelled);
        Assert.NotNull(cancelled);
        Assert.Equal(TicketStatus.Cancelled, cancelled.Status);

        // 3. Thử xác thực / check-in vé đã hủy -> Phải bị từ chối
        var validateRes = await _ticketService.ValidateAsync(new ValidateTicketRequest { TicketCode = ticket.TicketCode });
        Assert.False(validateRes.Valid);
        Assert.Equal("TICKET_CANCELLED", validateRes.ErrorCode);
    }

    [Fact]
    public async Task TicketsController_ExitSession_ShouldRevokeSessionSuccessfully()
    {
        // 1. Tạo vé và kích hoạt session
        var ticket = await _ticketService.CreateAsync(new TicketCreateRequest
        {
            TicketTypeId = 1,
            CustomerName = "Khách Đang Tham Quan"
        });
        var validate = await _ticketService.ValidateAsync(new ValidateTicketRequest { TicketCode = ticket.TicketCode });
        Assert.True(validate.Valid);
        Assert.NotNull(validate.SessionId);

        // 2. Gọi controller thoát phiên
        var controller = new TicketsController(_ticketService, _ticketSessionService);
        var exitResult = await controller.ExitSession(new ExitSessionRequest { SessionId = validate.SessionId.ToString() });

        var okResult = Assert.IsType<OkObjectResult>(exitResult);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);

        // 3. Vé vẫn còn nguyên vẹn trên hệ thống, không bị xóa hay hủy
        var checkTicket = await _ticketService.GetByIdAsync(ticket.TicketId);
        Assert.NotNull(checkTicket);
        Assert.Equal(TicketStatus.Used, checkTicket.Status);
    }
}
