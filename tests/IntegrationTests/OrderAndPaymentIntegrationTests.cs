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

    [Fact]
    public async Task CreateOrder_WithItemsArray_ShouldMapTicketTypeAndQuantity()
    {
        var request = new CreateOrderRequest
        {
            CustomerName = "Nguyễn Văn Client Items",
            CustomerEmail = "items@zooguide.vn",
            CustomerPhone = "0901234567",
            Items = new List<OrderItemRequest>
            {
                new OrderItemRequest { TicketTypeId = 1, Quantity = 2 }
            }
        };

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order);
        Assert.Equal(1, order.TicketTypeId);
        Assert.Equal(2, order.Quantity);
        Assert.Equal(120000m, order.UnitPrice);
        Assert.Equal(240000m, order.TotalAmount);
        Assert.Equal(PaymentStatus.Pending, order.PaymentStatus);
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
    // 4b. KIỂM THỬ XÁC THỰC WEBHOOK SECRET / CHỮ KÝ BẢO MẬT (YÊU CẦU STT 7)
    // =========================================================================
    [Fact]
    public async Task PaymentWebhook_WithInvalidSignature_ShouldReject()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 1,
            CustomerName = "Kiểm Thử Chữ Ký Sai",
            CustomerEmail = "sig@test.com",
            CustomerPhone = "0900000000"
        });

        var payload = new PaymentWebhookPayload
        {
            TransferAmount = 120000m,
            Content = $"THANH TOAN {order.PaymentDescription}",
            ReferenceCode = "REF-WRONG-SIG"
        };

        // Gửi kèm signature sai
        var result = await _orderService.ProcessPaymentWebhookAsync(payload, "InvalidSecretKey123");
        Assert.False(result);

        // Đơn hàng vẫn ở trạng thái Pending, không cấp vé
        var orderAfter = await _orderService.GetByOrderCodeAsync(order.OrderCode);
        Assert.Equal(PaymentStatus.Pending, orderAfter!.PaymentStatus);
        Assert.Empty(orderAfter.IssuedTickets);
    }

    [Fact]
    public async Task PaymentsController_HandleWebhook_WithVariousAuthHeaders_ShouldParseAndVerify()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 2,
            Quantity = 1,
            CustomerName = "Kiểm Thử Controller Webhook",
            CustomerEmail = "ctrl@test.com",
            CustomerPhone = "0911111111"
        });

        var controller = new PaymentsController(_orderService);
        var httpContext = new DefaultHttpContext();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        var payload = new PaymentWebhookPayload
        {
            TransferAmount = 60000m,
            Content = $"THANH TOAN {order.PaymentDescription}",
            ReferenceCode = "REF-CTRL-SEPAY"
        };

        // 0. Không gửi header chữ ký (Webhook thiếu chữ ký) -> BadRequest (400)
        var missingSigResult = await controller.HandleWebhook(payload);
        var missingSigResponse = Assert.IsType<BadRequestObjectResult>(missingSigResult);
        Assert.Equal(StatusCodes.Status400BadRequest, missingSigResponse.StatusCode);

        // 1. Gửi header sai -> BadRequest (400)
        httpContext.Request.Headers["Authorization"] = "Bearer WrongSecret";
        var badResult = await controller.HandleWebhook(payload);
        var badResponse = Assert.IsType<BadRequestObjectResult>(badResult);
        Assert.Equal(StatusCodes.Status400BadRequest, badResponse.StatusCode);

        // 2. Gửi header đúng chuẩn Apikey của SePay -> Ok (200)
        httpContext.Request.Headers["Authorization"] = "Apikey ZooGuideSecKey2026";
        var okResult = await controller.HandleWebhook(payload);
        var okResponse = Assert.IsType<OkObjectResult>(okResult);
        Assert.Equal(StatusCodes.Status200OK, okResponse.StatusCode);
    }

    [Fact]
    public async Task PaymentWebhook_And_Sandbox_WhenOrderExpired_ShouldRejectAndNotIssueTickets()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 2,
            CustomerName = "Khách Quá Hạn",
            CustomerEmail = "expired@zooguide.vn",
            CustomerPhone = "0905556666"
        });

        // Giả lập đơn hàng đã quá thời hạn 15 phút
        var dbOrder = await _context.TicketOrders.FindAsync(order.OrderId);
        dbOrder!.ExpiresAt = DateTime.UtcNow.AddMinutes(-2);
        await _context.SaveChangesAsync();

        // 1. Webhook đến khi đơn đã quá hạn -> Phải từ chối và chuyển trạng thái sang Expired
        var webhookResult = await _orderService.ProcessPaymentWebhookAsync(new PaymentWebhookPayload
        {
            TransferAmount = order.TotalAmount,
            Content = $"THANH TOAN {order.PaymentDescription}",
            ReferenceCode = "REF-EXPIRED-01"
        });
        Assert.False(webhookResult);

        var orderAfterWebhook = await _orderService.GetByOrderCodeAsync(order.OrderCode);
        Assert.Equal(PaymentStatus.Expired, orderAfterWebhook!.PaymentStatus);
        Assert.Empty(orderAfterWebhook.IssuedTickets);

        // 2. Sandbox thanh toán đơn quá hạn -> Phải ném ngoại lệ
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
            {
                OrderCode = order.OrderCode,
                Amount = order.TotalAmount
            }));
    }

    [Fact]
    public async Task PaymentWebhook_ConcurrentSimultaneousCalls_ShouldIssueTicketsExactlyOnce()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 2,
            CustomerName = "Khách Đồng Thời",
            CustomerEmail = "concurrent@zooguide.vn",
            CustomerPhone = "0907778888"
        });

        var payload = new PaymentWebhookPayload
        {
            TransferAmount = order.TotalAmount,
            Content = $"THANH TOAN {order.PaymentDescription}",
            ReferenceCode = "REF-CONCURRENT-01"
        };

        // Gửi 2 webhook đồng thời
        var results = await Task.WhenAll(
            _orderService.ProcessPaymentWebhookAsync(payload),
            _orderService.ProcessPaymentWebhookAsync(payload)
        );

        Assert.All(results, Assert.True);
        var ticketsInDb = await _context.Tickets.Where(t => t.OrderId == order.OrderId).ToListAsync();
        Assert.Equal(2, ticketsInDb.Count);
    }

    [Fact]
    public async Task TicketValidation_ConcurrentTwoDevices_ShouldAllowOnlyOneSession()
    {
        var ticket = await _ticketService.CreateAsync(new TicketCreateRequest
        {
            TicketTypeId = 1,
            CustomerName = "Khách Hai Thiết Bị"
        });

        // Hai thiết bị gửi yêu cầu kích hoạt cùng một vé tại cùng thời điểm
        var results = await Task.WhenAll(
            _ticketService.ValidateAsync(new ValidateTicketRequest { TicketCode = ticket.TicketCode }),
            _ticketService.ValidateAsync(new ValidateTicketRequest { TicketCode = ticket.TicketCode })
        );

        Assert.Single(results, r => r.Valid);
        Assert.Single(results, r => !r.Valid && r.ErrorCode == "TICKET_ALREADY_USED");

        var sessionsInDb = await _context.TicketSessions.Where(s => s.TicketId == ticket.TicketId).ToListAsync();
        Assert.Single(sessionsInDb);
    }

    [Fact]
    public async Task TicketsController_ExitSession_RepeatedCalls_SecondCallShouldReturnNotFound()
    {
        var ticket = await _ticketService.CreateAsync(new TicketCreateRequest
        {
            TicketTypeId = 1,
            CustomerName = "Khách Thoát Nhiều Lần"
        });
        var validate = await _ticketService.ValidateAsync(new ValidateTicketRequest { TicketCode = ticket.TicketCode });
        Assert.True(validate.Valid);

        var controller = new TicketsController(_ticketService, _ticketSessionService);

        // Lần 1: Thoát phiên thành công (200 OK)
        var exit1 = await controller.ExitSession(new ExitSessionRequest { SessionId = validate.SessionId.ToString() });
        Assert.IsType<OkObjectResult>(exit1);

        var sessionAfterFirstExit = await _context.TicketSessions.FirstAsync(s => s.SessionId == validate.SessionId);
        var firstEndedAt = sessionAfterFirstExit.EndedAt;
        Assert.NotNull(firstEndedAt);

        // Lần 2: Gửi lặp yêu cầu kết thúc -> Phải trả về 404 NotFound và giữ nguyên EndedAt ban đầu
        var exit2 = await controller.ExitSession(new ExitSessionRequest { SessionId = validate.SessionId.ToString() });
        Assert.IsType<NotFoundObjectResult>(exit2);

        var sessionAfterSecondExit = await _context.TicketSessions.FirstAsync(s => s.SessionId == validate.SessionId);
        Assert.Equal(firstEndedAt, sessionAfterSecondExit.EndedAt);
    }

    [Fact]
    public async Task GetOrderByCode_LookupPurchasedOrder_ReturnsAccurateStatusAndTickets()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 2,
            CustomerName = "Khách Hàng Tra Cứu",
            CustomerEmail = "lookup@zooguide.vn",
            CustomerPhone = "0922222222"
        });

        // Thanh toán qua sandbox
        await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest { OrderCode = order.OrderCode });

        // Tra cứu lại theo mã đơn hàng
        var retrieved = await _orderService.GetByOrderCodeAsync(order.OrderCode);
        Assert.NotNull(retrieved);
        Assert.Equal(PaymentStatus.Paid, retrieved.PaymentStatus);
        Assert.Equal(2, retrieved.IssuedTickets.Count);
        Assert.All(retrieved.IssuedTickets, t =>
        {
            Assert.StartsWith("ZG-", t.TicketCode);
            Assert.Equal(TicketStatus.Valid, t.Status);
        });
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
