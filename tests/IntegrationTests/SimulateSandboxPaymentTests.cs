using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.Application.DTOs.Order;
using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Repositories;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class SimulateSandboxPaymentTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly TicketService _ticketService;
    private readonly OrderService _orderService;
    private readonly DashboardService _dashboardService;
    private readonly OnlineUserTracker _onlineTracker;

    public SimulateSandboxPaymentTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuideSandboxTestsDb_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);

        var ticketRepo = new TicketRepository(_context);
        var sessionRepo = new TicketSessionRepository(_context);
        var sessionService = new TicketSessionService(ticketRepo, sessionRepo);
        _ticketService = new TicketService(_context, sessionService);

        _orderService = new OrderService(_context, _ticketService);
        _onlineTracker = new OnlineUserTracker();
        _dashboardService = new DashboardService(_context, _onlineTracker);

        SeedInitialData();
    }

    private void SeedInitialData()
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
    // TEST 1: Mua một vé và thanh toán mô phỏng thành công
    // =========================================================================
    [Fact]
    public async Task Test1_SimulatePayment_WithSingleTicket_SucceedsAndIssuesOneTicket()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 1,
            CustomerName = "Trần Văn A",
            CustomerEmail = "tranvana@gmail.com",
            CustomerPhone = "0901234567"
        });

        Assert.Equal(PaymentStatus.Pending, order.PaymentStatus);
        Assert.Empty(order.IssuedTickets);

        // Thực hiện giả lập thanh toán
        var paidOrder = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = order.OrderCode
        });

        Assert.Equal(PaymentStatus.Paid, paidOrder.PaymentStatus);
        Assert.NotNull(paidOrder.PaidAt);
        Assert.Single(paidOrder.IssuedTickets);

        var issued = paidOrder.IssuedTickets.First();
        Assert.StartsWith("ZG-", issued.TicketCode);
        Assert.Equal(TicketStatus.Valid, issued.Status);

        // Kiểm tra alias Tickets đồng bộ cho client
        Assert.Single(paidOrder.Tickets);
        Assert.Equal(issued.TicketCode, paidOrder.Tickets.First().TicketCode);

        // Vé được lưu chính xác trong database
        var dbTickets = await _context.Tickets.Where(t => t.OrderId == paidOrder.OrderId).ToListAsync();
        Assert.Single(dbTickets);
        Assert.Equal(issued.TicketCode, dbTickets.First().TicketCode);
    }

    // =========================================================================
    // TEST 2: Mua nhiều vé và kiểm tra số lượng phát hành chính xác
    // =========================================================================
    [Fact]
    public async Task Test2_SimulatePayment_WithMultipleTickets_IssuesExactQuantity()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 4,
            CustomerName = "Nguyễn Gia Đình",
            CustomerEmail = "family@gmail.com",
            CustomerPhone = "0909888999"
        });

        Assert.Equal(480000m, order.TotalAmount);

        var paidOrder = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = order.OrderCode,
            Amount = 480000m
        });

        Assert.Equal(PaymentStatus.Paid, paidOrder.PaymentStatus);
        Assert.Equal(4, paidOrder.IssuedTickets.Count);
        Assert.Equal(4, paidOrder.Tickets.Count);

        // Mỗi vé có mã QR/TicketCode độc nhất
        var distinctCodes = paidOrder.IssuedTickets.Select(t => t.TicketCode).Distinct().Count();
        Assert.Equal(4, distinctCodes);

        var dbTickets = await _context.Tickets.Where(t => t.OrderId == paidOrder.OrderId).ToListAsync();
        Assert.Equal(4, dbTickets.Count);
    }

    // =========================================================================
    // TEST 3: Thanh toán thất bại: Không được phát hành vé và không ghi nhận thành công
    // =========================================================================
    [Fact]
    public async Task Test3_SimulatePayment_WhenFailSimulationOrUnderpaid_ThrowsAndIssuesNoTickets()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 2,
            CustomerName = "Lê Thử Nghiệm",
            CustomerEmail = "tester@gmail.com",
            CustomerPhone = "0987654321"
        });

        // 3a. Trường hợp số tiền không đủ
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
            {
                OrderCode = order.OrderCode,
                Amount = 100000m // Yêu cầu 240,000đ nhưng chỉ truyền 100,000đ
            }));

        var orderAfterUnderpaid = await _context.TicketOrders.FindAsync(order.OrderId);
        Assert.Equal(PaymentStatus.Pending, orderAfterUnderpaid!.PaymentStatus);
        var ticketsAfterUnderpaid = await _context.Tickets.Where(t => t.OrderId == order.OrderId).ToListAsync();
        Assert.Empty(ticketsAfterUnderpaid);

        // 3b. Trường hợp mô phỏng lỗi giao dịch từ chối (FailSimulation = true)
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
            {
                OrderCode = order.OrderCode,
                FailSimulation = true
            }));

        var orderAfterFail = await _context.TicketOrders.FindAsync(order.OrderId);
        Assert.Equal(PaymentStatus.Failed, orderAfterFail!.PaymentStatus);

        var dbTickets = await _context.Tickets.Where(t => t.OrderId == order.OrderId).ToListAsync();
        Assert.Empty(dbTickets);
    }

    // =========================================================================
    // TEST 4: Nhấn nút thanh toán liên tục / lặp lại: Không phát hành trùng vé (Idempotency)
    // =========================================================================
    [Fact]
    public async Task Test4_SimulatePayment_RepeatedClicks_DoesNotDuplicateTickets()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 2,
            CustomerName = "Đặng Nhấn Nhanh",
            CustomerEmail = "rapidclick@gmail.com",
            CustomerPhone = "0911223344"
        });

        // Lần 1: Thanh toán thành công
        var result1 = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = order.OrderCode
        });
        Assert.Equal(2, result1.IssuedTickets.Count);
        var initialTicketIds = result1.IssuedTickets.Select(t => t.TicketId).OrderBy(id => id).ToList();

        // Lần 2: Người dùng nhấn nút lần nữa ngay sau đó
        var result2 = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = order.OrderCode
        });
        Assert.Equal(2, result2.IssuedTickets.Count);
        var secondTicketIds = result2.IssuedTickets.Select(t => t.TicketId).OrderBy(id => id).ToList();

        // Lần 3: Tải lại trang và gửi lại request
        var result3 = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = order.OrderCode
        });
        Assert.Equal(2, result3.IssuedTickets.Count);
        var thirdTicketIds = result3.IssuedTickets.Select(t => t.TicketId).OrderBy(id => id).ToList();

        // Danh sách ID vé hoàn toàn giống nhau, không tạo thêm bất kỳ vé thừa nào trong DB
        Assert.Equal(initialTicketIds, secondTicketIds);
        Assert.Equal(initialTicketIds, thirdTicketIds);

        var totalDbTickets = await _context.Tickets.Where(t => t.OrderId == order.OrderId).CountAsync();
        Assert.Equal(2, totalDbTickets);
    }

    // =========================================================================
    // TEST 5: Vé sau khi phát hành có thể quét và kích hoạt phiên tham quan bình thường
    // =========================================================================
    [Fact]
    public async Task Test5_IssuedTickets_CanBeValidatedAndActivatedForTourSession()
    {
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 1,
            CustomerName = "Võ Tham Quan",
            CustomerEmail = "vothamquan@gmail.com",
            CustomerPhone = "0933445566"
        });

        var paidOrder = await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
        {
            OrderCode = order.OrderCode
        });

        var ticketCode = paidOrder.IssuedTickets.First().TicketCode;

        // Quét / Xác thực vé
        var validateResult = await _ticketService.ValidateAsync(new ValidateTicketRequest
        {
            TicketCode = ticketCode
        });

        Assert.True(validateResult.Valid);
        Assert.NotNull(validateResult.SessionId);
        Assert.True(validateResult.ExpiresAt > DateTime.UtcNow);

        // Sau khi quét lần 1, vé chuyển sang Used
        var dbTicket = await _context.Tickets.FirstAsync(t => t.TicketCode == ticketCode);
        Assert.Equal(TicketStatus.Used, dbTicket.Status);
    }

    // =========================================================================
    // TEST 6: Dashboard đồng bộ chính xác số vé đã bán và người mua vé thực tế
    // =========================================================================
    [Fact]
    public async Task Test6_DashboardStats_AccuratelyReflectsSoldTicketsAfterSandboxPayment()
    {
        // 1. Tạo đơn 1: 3 vé, thanh toán thành công
        var order1 = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 3,
            CustomerName = "Người Mua 1",
            CustomerEmail = "buyer1@example.com",
            CustomerPhone = "0900000001"
        });
        await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest { OrderCode = order1.OrderCode });

        // 2. Tạo đơn 2: 2 vé, cùng email buyer1@example.com (người mua mua lần 2)
        var order2 = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 2,
            CustomerName = "Người Mua 1",
            CustomerEmail = "buyer1@example.com",
            CustomerPhone = "0900000001"
        });
        await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest { OrderCode = order2.OrderCode });

        // 3. Tạo đơn 3: 1 vé, đơn hàng Pending (chưa thanh toán)
        await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 1,
            CustomerName = "Người Chờ",
            CustomerEmail = "pending@example.com",
            CustomerPhone = "0900000003"
        });

        // 4. Tạo đơn 4: 5 vé, đơn hàng thanh toán thất bại
        var order4 = await _orderService.CreateOrderAsync(new CreateOrderRequest
        {
            TicketTypeId = 1,
            Quantity = 5,
            CustomerName = "Người Thất Bại",
            CustomerEmail = "failed@example.com",
            CustomerPhone = "0900000004"
        });
        try
        {
            await _orderService.SimulateSandboxPaymentAsync(new SimulatePaymentRequest
            {
                OrderCode = order4.OrderCode,
                FailSimulation = true
            });
        }
        catch {}

        var stats = await _dashboardService.GetStatsAsync();

        // Tổng vé bán: 3 (đơn 1) + 2 (đơn 2) = 5 vé (không tính đơn 3 Pending và đơn 4 Failed)
        Assert.Equal(5, stats.TotalTicketsSold);

        // Tổng người mua vé duy nhất: Chỉ có buyer1@example.com = 1 người
        Assert.Equal(1, stats.TotalTicketBuyers);
    }
}
