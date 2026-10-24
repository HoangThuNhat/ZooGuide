using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZooGuide.Application.DTOs;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

/// <summary>
/// BỘ KIỂM THỬ BẮT BUỘC THEO YÊU CẦU:
/// "SỬA LOGIC THỐNG KÊ NGƯỜI DÙNG TRÊN ADMIN DASHBOARD"
/// </summary>
public class TicketBuyerOnlineStatisticsTests : IDisposable
{
    private readonly ZooGuideDbContext _context;
    private readonly OnlineUserTracker _onlineTracker;
    private readonly DashboardService _dashboardService;

    public TicketBuyerOnlineStatisticsTests()
    {
        var options = new DbContextOptionsBuilder<ZooGuideDbContext>()
            .UseInMemoryDatabase(databaseName: $"ZooGuideBuyerStatsDb_{Guid.NewGuid()}")
            .Options;

        _context = new ZooGuideDbContext(options);
        _onlineTracker = new OnlineUserTracker();
        _dashboardService = new DashboardService(_context, _onlineTracker);

        SeedInitialData();
    }

    private void SeedInitialData()
    {
        var ticketType = new TicketType
        {
            TicketTypeId = 1,
            Name = "Vé Tiêu Chuẩn Thảo Cầm Viên",
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
    // TEST 1: Khách vào website nhưng chưa mua vé: KHÔNG tính vào chỉ số người mua vé online
    // =========================================================================
    [Fact]
    public void Test1_VisitorBrowsingWebsite_NotCountedAsActiveTicketBuyer()
    {
        // Khách vãng lai truy cập web (chưa mua vé)
        _onlineTracker.RegisterConnection("vis:device-visitor-1", "conn-tab-1", isTicketBuyer: false);
        _onlineTracker.RegisterConnection("vis:device-visitor-2", "conn-tab-2", isTicketBuyer: false);

        // Chỉ số người mua vé đang hoạt động PHẢI LÀ 0
        Assert.Equal(0, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(0, _onlineTracker.GetActiveBuyerConnectionsCount());
        // Chỉ số OnlineUsers hiển thị trên dashboard cũng là 0
        Assert.Equal(0, _onlineTracker.GetOnlineUsersCount());
    }

    // =========================================================================
    // TEST 2: Khách mua vé thành công: được ghi nhận đúng một lần
    // =========================================================================
    [Fact]
    public void Test2_SuccessfulTicketBuyer_IsCountedExactlyOnce()
    {
        // Khách mua vé thành công với email test.buyer@gmail.com
        var isNewBuyer = _onlineTracker.RegisterConnection("buyer:test.buyer@gmail.com", "conn-tab-1", isTicketBuyer: true);

        Assert.True(isNewBuyer);
        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(1, _onlineTracker.GetActiveBuyerConnectionsCount());
        Assert.Equal(1, _onlineTracker.GetOnlineUsersCount());
    }

    // =========================================================================
    // TEST 3: Giao dịch thất bại hoặc bị hủy: không được tính là mua vé thành công
    // =========================================================================
    [Fact]
    public async Task Test3_FailedOrCancelledTransaction_IsNotCountedAsSuccessfulSaleOrBuyer()
    {
        // Thêm các đơn hàng chưa thanh toán hoặc thất bại
        _context.TicketOrders.AddRange(
            new TicketOrder
            {
                OrderId = 101,
                OrderCode = "ZG-PENDING",
                CustomerEmail = "pending@gmail.com",
                PaymentStatus = PaymentStatus.Pending,
                Quantity = 2,
                TotalAmount = 240000m
            },
            new TicketOrder
            {
                OrderId = 102,
                OrderCode = "ZG-FAILED",
                CustomerEmail = "failed@gmail.com",
                PaymentStatus = PaymentStatus.Failed,
                Quantity = 1,
                TotalAmount = 120000m
            },
            new TicketOrder
            {
                OrderId = 103,
                OrderCode = "ZG-EXPIRED",
                CustomerEmail = "expired@gmail.com",
                PaymentStatus = PaymentStatus.Expired,
                Quantity = 3,
                TotalAmount = 360000m
            }
        );
        await _context.SaveChangesAsync();

        var stats = await _dashboardService.GetStatsAsync();

        // Không có đơn nào Paid -> TotalTicketBuyers = 0, TotalTicketsSold = 0
        Assert.Equal(0, stats.TotalTicketBuyers);
        Assert.Equal(0, stats.TotalTicketsSold);
        Assert.Equal(0, stats.ActiveTicketBuyers);
    }

    // =========================================================================
    // TEST 4: Khách tải lại trang hoặc mở nhiều tab: không tự động nhân đôi số người mua
    // =========================================================================
    [Fact]
    public void Test4_BuyerReloadsOrOpensMultipleTabs_DoesNotDuplicateBuyerCount()
    {
        var buyerId = "buyer:khachvip@gmail.com";

        // Tab 1 mở
        var isNew1 = _onlineTracker.RegisterConnection(buyerId, "tab-conn-1", isTicketBuyer: true);
        // Tab 2 mở (hoặc reload trang sinh connectionId mới)
        var isNew2 = _onlineTracker.RegisterConnection(buyerId, "tab-conn-2", isTicketBuyer: true);
        // Tab 3 mở
        var isNew3 = _onlineTracker.RegisterConnection(buyerId, "tab-conn-3", isTicketBuyer: true);

        Assert.True(isNew1);
        Assert.False(isNew2);
        Assert.False(isNew3);

        // Số người mua vé đang online vẫn DUY NHẤT LÀ 1 người
        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        // Số thiết bị/phiên kết nối là 3
        Assert.Equal(3, _onlineTracker.GetActiveBuyerConnectionsCount());

        // Đóng 1 tab
        _onlineTracker.RemoveConnection(buyerId, "tab-conn-1");
        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(2, _onlineTracker.GetActiveBuyerConnectionsCount());
    }

    // =========================================================================
    // TEST 5: Phiên hoạt động hết timeout / ngắt kết nối: không còn được tính online
    // =========================================================================
    [Fact]
    public void Test5_SessionDisconnectOrTimeout_RemovesBuyerFromOnlineCount()
    {
        var buyerId = "buyer:timeout.user@gmail.com";
        _onlineTracker.RegisterConnection(buyerId, "tab-1", isTicketBuyer: true);

        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());

        // Client gửi beacon disconnect khi đóng trình duyệt
        var wentOffline = _onlineTracker.RemoveConnection(buyerId, "beacon");

        Assert.True(wentOffline);
        Assert.Equal(0, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(0, _onlineTracker.GetActiveBuyerConnectionsCount());
    }

    // =========================================================================
    // TEST 6: Hai trình duyệt trên cùng thiết bị (Chrome và Safari)
    //         - Có cùng email mua vé: gộp chính xác thành 1 người mua vé, 2 kết nối
    //         - Trình duyệt chưa mua vé: không được tính là người mua vé online
    // =========================================================================
    [Fact]
    public void Test6_TwoBrowsersOnSameDevice_GroupedByBuyerIdentity()
    {
        // Giả sử trên cùng một máy tính:
        // Trình duyệt 1 (Chrome): Khách mua vé với email nguyenphat@example.com
        _onlineTracker.RegisterConnection("buyer:nguyenphat@example.com", "chrome-conn-1", isTicketBuyer: true);

        // Trình duyệt 2 (Safari): Khách cũng dùng email nguyenphat@example.com
        _onlineTracker.RegisterConnection("buyer:nguyenphat@example.com", "safari-conn-1", isTicketBuyer: true);

        // Trình duyệt 3 (Firefox): Khách vãng lai chưa nhập vé / chưa mua vé
        _onlineTracker.RegisterConnection("vis:firefox-device-unverified", "firefox-conn-1", isTicketBuyer: false);

        // Kết quả: Hệ thống nhận diện 1 người mua vé duy nhất (với 2 kết nối từ Chrome và Safari)
        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(2, _onlineTracker.GetActiveBuyerConnectionsCount());

        // Firefox vãng lai không bị tính vào chỉ số người mua vé online
    }

    // =========================================================================
    // TEST 7: Dashboard lấy số liệu từ backend và database thực tế
    // =========================================================================
    [Fact]
    public async Task Test7_DashboardStats_CalculatesDistinctBuyers_AndTotalSoldTickets_FromDatabase()
    {
        // Seed database với dữ liệu thực tế:
        // Khách A: Mua 2 đơn hàng thành công (đơn 1: 2 vé, đơn 2: 3 vé)
        _context.TicketOrders.Add(new TicketOrder
        {
            OrderId = 201,
            OrderCode = "ZG-A1",
            CustomerEmail = "khach.a@gmail.com",
            PaymentStatus = PaymentStatus.Paid,
            Quantity = 2,
            TotalAmount = 240000m
        });
        _context.TicketOrders.Add(new TicketOrder
        {
            OrderId = 202,
            OrderCode = "ZG-A2",
            CustomerEmail = "KHACH.A@GMAIL.COM", // Chữ hoa (test kiểm tra khử trùng lặp hoa/thường)
            PaymentStatus = PaymentStatus.Paid,
            Quantity = 3,
            TotalAmount = 360000m
        });

        // Khách B: Mua 1 đơn thành công (1 vé)
        _context.TicketOrders.Add(new TicketOrder
        {
            OrderId = 203,
            OrderCode = "ZG-B1",
            CustomerEmail = "khach.b@gmail.com",
            PaymentStatus = PaymentStatus.Paid,
            Quantity = 1,
            TotalAmount = 120000m
        });

        // Khách C: Đơn hàng Pending (chưa thanh toán)
        _context.TicketOrders.Add(new TicketOrder
        {
            OrderId = 204,
            OrderCode = "ZG-C1",
            CustomerEmail = "khach.c@gmail.com",
            PaymentStatus = PaymentStatus.Pending,
            Quantity = 5,
            TotalAmount = 600000m
        });

        await _context.SaveChangesAsync();

        // Khách A đang online mở 2 tab
        _onlineTracker.RegisterConnection("buyer:khach.a@gmail.com", "tab-1", isTicketBuyer: true);
        _onlineTracker.RegisterConnection("buyer:khach.a@gmail.com", "tab-2", isTicketBuyer: true);

        // Khách vãng lai cũng đang lướt web
        _onlineTracker.RegisterConnection("vis:anonymous-visitor", "tab-3", isTicketBuyer: false);

        var stats = await _dashboardService.GetStatsAsync();

        // 1. Số người mua vé (TotalTicketBuyers): Khách A + Khách B = 2 người duy nhất trong DB
        Assert.Equal(2, stats.TotalTicketBuyers);

        // 2. Tổng vé đã bán (TotalTicketsSold): 2 (đơn A1) + 3 (đơn A2) + 1 (đơn B1) = 6 vé
        Assert.Equal(6, stats.TotalTicketsSold);

        // 3. Người mua vé đang hoạt động (ActiveTicketBuyers): Chỉ có Khách A = 1 người
        Assert.Equal(1, stats.ActiveTicketBuyers);

        // 4. Thiết bị/phiên của người mua vé (ActiveBuyerConnections): Khách A có 2 tab = 2 kết nối
        Assert.Equal(2, stats.ActiveBuyerConnections);

        // 5. OnlineUsers = 1 (không tính anonymous-visitor)
        Assert.Equal(1, stats.OnlineUsers);
    }

    // =========================================================================
    // TEST 8: Kịch bản 1 — Khách chỉ vào website, chưa mua vé
    //         - Người mua vé đang hoạt động = 0
    //         - Thiết bị / phiên đang hoạt động = 1
    // =========================================================================
    [Fact]
    public void Test8_VisitorBrowsing_ActiveTicketBuyersIsZero_ActiveDevicesIsOne()
    {
        _onlineTracker.RegisterDeviceConnection("device-visitor-only", "conn-tab-1", isTicketBuyer: false);

        Assert.Equal(0, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(1, _onlineTracker.GetActiveDevicesCount());
    }

    // =========================================================================
    // TEST 9: Kịch bản 2 — Khách mua vé thành công
    //         - Người mua vé đang hoạt động tăng lên 1
    //         - Thiết bị / phiên đang hoạt động tính đúng 1
    // =========================================================================
    [Fact]
    public void Test9_SuccessfulBuyer_ActiveTicketBuyersIsOne_ActiveDevicesIsOne()
    {
        var deviceId = "device-buyer-1";
        _onlineTracker.RegisterDeviceConnection(deviceId, "conn-tab-1", isTicketBuyer: false);

        Assert.Equal(0, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(1, _onlineTracker.GetActiveDevicesCount());

        // Thanh toán thành công -> Nâng cấp thiết bị thành Ticket Buyer
        _onlineTracker.MarkDeviceAsTicketBuyer(deviceId, "customer@gmail.com", "ZG-ORDER-001");

        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(1, _onlineTracker.GetActiveDevicesCount());
    }

    // =========================================================================
    // TEST 10: Kịch bản 3 — Mở nhiều tab hoặc tải lại trang trên cùng một trình duyệt
    //          - Không tăng số người mua vé đang hoạt động (vẫn là 1)
    //          - Không đếm mỗi tab là một thiết bị mới (vẫn là 1 thiết bị)
    // =========================================================================
    [Fact]
    public void Test10_MultipleTabsOrReloadOnSameBrowser_DoesNotDuplicateBuyersOrDevices()
    {
        var deviceId = "browser-installation-1";
        var buyerEmail = "loyal.visitor@gmail.com";

        // Tab 1
        _onlineTracker.RegisterDeviceConnection(deviceId, "tab-conn-1", isTicketBuyer: true, buyerKey: buyerEmail);
        // Tab 2
        _onlineTracker.RegisterDeviceConnection(deviceId, "tab-conn-2", isTicketBuyer: true, buyerKey: buyerEmail);
        // Tab 3 (F5 tải lại trang)
        _onlineTracker.RegisterDeviceConnection(deviceId, "tab-conn-3", isTicketBuyer: true, buyerKey: buyerEmail);

        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(1, _onlineTracker.GetActiveDevicesCount());
        Assert.Equal(3, _onlineTracker.GetActiveBuyerConnectionsCount()); // 3 kết nối socket/tab
    }

    // =========================================================================
    // TEST 11: Kịch bản 4 — Hai trình duyệt độc lập (Chrome & Safari) cùng một người mua vé
    //          - Người mua vé đang hoạt động = 1 (cùng email người mua)
    //          - Thiết bị / phiên đang hoạt động = 2 (2 browser/thiết bị riêng biệt)
    // =========================================================================
    [Fact]
    public void Test11_TwoIndependentBrowsers_SameBuyer_OneBuyerTwoDevices()
    {
        var buyerEmail = "shared.buyer@gmail.com";

        // Chrome browser
        _onlineTracker.RegisterDeviceConnection("chrome-device-uuid", "chrome-tab-1", isTicketBuyer: true, buyerKey: buyerEmail);
        // Safari browser
        _onlineTracker.RegisterDeviceConnection("safari-device-uuid", "safari-tab-1", isTicketBuyer: true, buyerKey: buyerEmail);

        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(2, _onlineTracker.GetActiveDevicesCount());
    }

    // =========================================================================
    // TEST 12: Kịch bản 5 — Khách đóng trang hoặc hết timeout:
    //          - Người mua vé đang hoạt động tự động giảm về 0 khi không còn ai
    //          - Thiết bị / phiên đang hoạt động tự động giảm về 0 khi toàn bộ thoát
    //          - Dữ liệu người mua và lịch sử vé trong database vẫn nguyên vẹn
    // =========================================================================
    [Fact]
    public async Task Test12_DisconnectAndTimeout_DropCountsToZero_PreservingDatabaseData()
    {
        // 1. Lưu đơn hàng và vé vào DB
        var order = new TicketOrder
        {
            OrderId = 301,
            OrderCode = "ZG-PERSISTENT",
            CustomerEmail = "persistent@gmail.com",
            PaymentStatus = PaymentStatus.Paid,
            Quantity = 2,
            TotalAmount = 240000m
        };
        _context.TicketOrders.Add(order);
        await _context.SaveChangesAsync();

        var deviceId = "device-persistent";
        _onlineTracker.RegisterDeviceConnection(deviceId, "tab-1", isTicketBuyer: true, buyerKey: "persistent@gmail.com");

        Assert.Equal(1, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(1, _onlineTracker.GetActiveDevicesCount());

        // 2. Client đóng tab / rời trang
        var wentOffline = _onlineTracker.RemoveDeviceConnection(deviceId, "tab-1");

        Assert.True(wentOffline);
        Assert.Equal(0, _onlineTracker.GetActiveTicketBuyersCount());
        Assert.Equal(0, _onlineTracker.GetActiveDevicesCount());

        // 3. Kiểm tra DB: Đơn hàng và số vé đã bán vẫn được bảo toàn nguyên vẹn
        var dbOrder = await _context.TicketOrders.FindAsync(301);
        Assert.NotNull(dbOrder);
        Assert.Equal(PaymentStatus.Paid, dbOrder.PaymentStatus);
        Assert.Equal(2, dbOrder.Quantity);

        var stats = await _dashboardService.GetStatsAsync();
        Assert.Equal(1, stats.TotalTicketBuyers);
        Assert.Equal(2, stats.TotalTicketsSold);
        Assert.Equal(0, stats.ActiveTicketBuyers);
        Assert.Equal(0, stats.ActiveDevices);
    }
}
