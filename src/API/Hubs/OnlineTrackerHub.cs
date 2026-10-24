using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.API.Hubs;

public class OnlineTrackerHub : Hub
{
    private readonly IOnlineUserTracker _tracker;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OnlineTrackerHub> _logger;

    public OnlineTrackerHub(
        IOnlineUserTracker tracker,
        IServiceScopeFactory scopeFactory,
        ILogger<OnlineTrackerHub> logger)
    {
        _tracker = tracker;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var visitorId = httpContext?.Request.Query["visitorId"].ToString();
        var userId = httpContext?.Request.Query["userId"].ToString();
        var role = httpContext?.Request.Query["role"].ToString();
        var orderCode = httpContext?.Request.Query["orderCode"].ToString();
        var buyerEmail = httpContext?.Request.Query["buyerEmail"].ToString();
        var ticketCode = httpContext?.Request.Query["ticketCode"].ToString();

        var deviceId = !string.IsNullOrWhiteSpace(visitorId)
            ? visitorId.Trim()
            : (!string.IsNullOrWhiteSpace(userId) ? userId.Trim() : Context.ConnectionId);

        bool isTicketBuyer = false;
        string? verifiedEmail = null;

        // Chỉ xác nhận là Ticket Buyer nếu đơn hàng hoặc vé đã thanh toán thành công trong cơ sở dữ liệu
        if (!string.IsNullOrWhiteSpace(orderCode) || !string.IsNullOrWhiteSpace(buyerEmail) || !string.IsNullOrWhiteSpace(ticketCode))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ZooGuideDbContext>();

                if (!string.IsNullOrWhiteSpace(orderCode))
                {
                    var trimmedCode = orderCode.Trim();
                    var order = await dbContext.TicketOrders
                        .AsNoTracking()
                        .FirstOrDefaultAsync(o => o.OrderCode == trimmedCode && o.PaymentStatus == PaymentStatus.Paid);

                    if (order != null)
                    {
                        isTicketBuyer = true;
                        verifiedEmail = order.CustomerEmail;
                    }
                }

                if (!isTicketBuyer && !string.IsNullOrWhiteSpace(buyerEmail))
                {
                    var trimmedEmail = buyerEmail.Trim().ToLower();
                    var hasPaid = await dbContext.TicketOrders
                        .AsNoTracking()
                        .AnyAsync(o => o.CustomerEmail.ToLower() == trimmedEmail && o.PaymentStatus == PaymentStatus.Paid);

                    if (hasPaid)
                    {
                        isTicketBuyer = true;
                        verifiedEmail = trimmedEmail;
                    }
                }

                if (!isTicketBuyer && !string.IsNullOrWhiteSpace(ticketCode))
                {
                    var trimmedTicket = ticketCode.Trim();
                    var ticket = await dbContext.Tickets
                        .Include(t => t.Order)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.TicketCode == trimmedTicket);

                    if (ticket != null && (ticket.Order?.PaymentStatus == PaymentStatus.Paid || ticket.Status == TicketStatus.Valid || ticket.Status == TicketStatus.Used))
                    {
                        isTicketBuyer = true;
                        verifiedEmail = ticket.Order?.CustomerEmail;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi kiểm tra trạng thái vé khi client kết nối Hub.");
            }
        }

        string? buyerKey = isTicketBuyer
            ? (verifiedEmail ?? buyerEmail ?? deviceId).ToLower().Trim()
            : null;

        Context.Items["DeviceId"] = deviceId;
        Context.Items["IsTicketBuyer"] = isTicketBuyer;
        Context.Items["BuyerKey"] = buyerKey;

        var isNewDevice = _tracker.RegisterDeviceConnection(deviceId, Context.ConnectionId, isTicketBuyer: isTicketBuyer, buyerKey: buyerKey, orderCode: orderCode);

        // Nếu là Quản trị viên (Admin Dashboard), thêm vào nhóm "Admins"
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
            var activeBuyers = _tracker.GetActiveTicketBuyersCount();
            var activeDevs = _tracker.GetActiveDevicesCount();
            var activeConn = _tracker.GetActiveBuyerConnectionsCount();
            var activeBuyerDevices = _tracker.GetActiveTicketBuyerDevicesCount();
            await Clients.Caller.SendAsync("ActiveBuyersUpdated", new
{
    activeTicketBuyers = activeBuyers,
    activeTicketBuyerDevices = activeBuyerDevices,
    activeDevices = activeDevs,
    activeBuyerConnections = activeConn
});

await Clients.Caller.SendAsync("ActiveDevicesUpdated", new
{
    activeDevices = activeDevs,
    activeTicketBuyerDevices = activeBuyerDevices
});

await Clients.Caller.SendAsync("OnlineUsersUpdated", activeBuyers);
        }

        // Thông báo cho Dashboard Admin khi có thiết bị/phiên mới hoặc trạng thái thay đổi
        if (isNewDevice)
        {
            await BroadcastToAdmins();
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (Context.Items.TryGetValue("DeviceId", out var idObj) && idObj is string deviceId)
        {
            var deviceWentOffline = _tracker.RemoveDeviceConnection(deviceId, Context.ConnectionId);
            if (deviceWentOffline)
            {
                await BroadcastToAdmins();
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Nâng cấp phiên làm việc thành người mua vé ngay sau khi thanh toán thành công mà không cần tải lại trang
    /// </summary>
    public async Task<bool> RegisterBuyer(string orderCode, string buyerEmail)
    {
        if (string.IsNullOrWhiteSpace(orderCode) && string.IsNullOrWhiteSpace(buyerEmail))
            return false;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ZooGuideDbContext>();

            var trimmedCode = orderCode?.Trim();
            var trimmedEmail = buyerEmail?.Trim().ToLower();

            var order = await dbContext.TicketOrders
                .AsNoTracking()
                .FirstOrDefaultAsync(o => (o.OrderCode == trimmedCode || o.CustomerEmail.ToLower() == trimmedEmail) && o.PaymentStatus == PaymentStatus.Paid);

            if (order == null)
            {
                _logger.LogWarning("Không thể nâng cấp session: Đơn hàng {OrderCode} / {Email} chưa thanh toán thành công.", orderCode, buyerEmail);
                return false;
            }

            var deviceId = Context.Items.TryGetValue("DeviceId", out var devObj) && devObj is string d
                ? d
                : Context.ConnectionId;

            var buyerKey = (order.CustomerEmail ?? trimmedEmail ?? deviceId).ToLower().Trim();
            Context.Items["IsTicketBuyer"] = true;
            Context.Items["BuyerKey"] = buyerKey;

            _tracker.MarkDeviceAsTicketBuyer(deviceId, buyerKey, order.OrderCode);
            await BroadcastToAdmins();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xử lý RegisterBuyer cho đơn hàng {OrderCode}", orderCode);
            return false;
        }
    }

    /// <summary>
    /// Client gửi ping định kỳ giữ kết nối và gia hạn thời gian online
    /// </summary>
    public Task Heartbeat()
    {
        var deviceId = Context.Items.TryGetValue("DeviceId", out var devObj) && devObj is string d ? d : Context.ConnectionId;
        bool isBuyer = Context.Items.TryGetValue("IsTicketBuyer", out var bObj) && bObj is bool b && b;
        var buyerKey = Context.Items.TryGetValue("BuyerKey", out var kObj) ? kObj as string : null;

        _tracker.RefreshHeartbeat(deviceId, Context.ConnectionId, isBuyer, buyerKey);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Cho phép client truy vấn trực tiếp số lượng người mua vé online qua WebSocket
    /// </summary>
    public int GetOnlineCount()
    {
        return _tracker.GetActiveTicketBuyersCount();
    }

    /// <summary>
    /// Cho phép client truy vấn trực tiếp số lượng thiết bị/phiên đang hoạt động
    /// </summary>
    public int GetActiveDevicesCount()
    {
        return _tracker.GetActiveDevicesCount();
    }

    

    
private Task BroadcastToAdmins()
{
    var activeBuyers = _tracker.GetActiveTicketBuyersCount();
    var activeBuyerDevices = _tracker.GetActiveTicketBuyerDevicesCount();
    var activeDevs = _tracker.GetActiveDevicesCount();
    var activeConn = _tracker.GetActiveBuyerConnectionsCount();

    return Task.WhenAll(
        Clients.Group("Admins").SendAsync("ActiveBuyersUpdated", new
        {
            activeTicketBuyers = activeBuyers,
            activeTicketBuyerDevices = activeBuyerDevices,
            activeDevices = activeDevs,
            activeBuyerConnections = activeConn
        }),
        Clients.Group("Admins").SendAsync("ActiveDevicesUpdated", new
        {
            activeDevices = activeDevs,
            activeTicketBuyerDevices = activeBuyerDevices
        }),
        Clients.Group("Admins").SendAsync("OnlineUsersUpdated", activeBuyers)
    );
}

}
