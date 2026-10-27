using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ZooGuide.API.Hubs;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly IDeviceTrackingService _deviceTrackingService;

    public DevicesController(IDeviceTrackingService deviceTrackingService)
    {
        _deviceTrackingService = deviceTrackingService;
    }

    /// <summary>
    /// Ghi nhận heartbeat từ thiết bị khách (PWA / Web Browser)
    /// </summary>
    [HttpPost("heartbeat")]
    [ProducesResponseType(typeof(ApiResponse<DeviceHeartbeatResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DeviceHeartbeatResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Heartbeat(
        [FromBody] DeviceHeartbeatRequestDto request,
        [FromServices] IOnlineUserTracker? onlineTracker = null,
        [FromServices] ZooGuideDbContext? dbContext = null,
        [FromServices] IHubContext<OnlineTrackerHub>? hubContext = null)
    {
        if (string.IsNullOrWhiteSpace(request.InstallationId))
        {
            return BadRequest(ApiResponse<DeviceHeartbeatResponseDto>.Fail("InstallationId không được để trống."));
        }

        var userAgent = Request.Headers["User-Agent"].ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        bool isPaidBuyer = false;
        string? verifiedEmail = null;

        if (dbContext != null && (!string.IsNullOrWhiteSpace(request.OrderCode) || !string.IsNullOrWhiteSpace(request.BuyerEmail)))
        {
            var trimmedCode = request.OrderCode?.Trim();
            var trimmedEmail = request.BuyerEmail?.Trim().ToLower();

            var order = await dbContext.TicketOrders
                .AsNoTracking()
                .FirstOrDefaultAsync(o => (o.OrderCode == trimmedCode || o.CustomerEmail.ToLower() == trimmedEmail) && o.PaymentStatus == PaymentStatus.Paid);

            if (order != null)
            {
                isPaidBuyer = true;
                verifiedEmail = order.CustomerEmail;
            }
        }

        if (onlineTracker != null)
        {
            var deviceId = request.InstallationId.Trim();
            var buyerKey = isPaidBuyer ? (verifiedEmail ?? request.BuyerEmail ?? deviceId).ToLower().Trim() : null;
            onlineTracker.RefreshHeartbeat(deviceId, "http-heartbeat", isPaidBuyer, buyerKey, request.OrderCode);
        }

        var result = await _deviceTrackingService.RecordHeartbeatAsync(request.InstallationId, userAgent, ipAddress);
        return Ok(ApiResponse<DeviceHeartbeatResponseDto>.Ok(result));
    }

    /// <summary>
    /// Tiếp nhận thông báo ngắt kết nối (Navigator.sendBeacon khi đóng tab/trình duyệt)
    /// </summary>
    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect(
        [FromBody] DeviceHeartbeatRequestDto request,
        [FromServices] IOnlineUserTracker onlineTracker,
        [FromServices] IHubContext<OnlineTrackerHub> hubContext)
    {
        if (!string.IsNullOrWhiteSpace(request?.InstallationId))
        {
            var deviceId = request.InstallationId.Trim();
            await _deviceTrackingService.RecordDisconnectAsync(deviceId);
            var deviceWentOffline = onlineTracker.RemoveDeviceConnection(deviceId, "beacon");

            // Backward compatibility
            if (!string.IsNullOrWhiteSpace(request.BuyerEmail))
            {
                onlineTracker.RemoveConnection($"buyer:{request.BuyerEmail.ToLower().Trim()}", "beacon");
            }
            onlineTracker.RemoveConnection($"vis:{deviceId}", "beacon");

            var activeBuyers = onlineTracker.GetActiveTicketBuyersCount();
            var activeDevs = await _deviceTrackingService.GetActiveDevicesCountAsync(60);
            var activeConn = onlineTracker.GetActiveBuyerConnectionsCount();

            await hubContext.Clients.Group("Admins").SendAsync("ActiveBuyersUpdated", new
            {
                activeTicketBuyers = activeBuyers,
                activeDevices = activeDevs,
                activeBuyerConnections = activeConn
            });
            await hubContext.Clients.Group("Admins").SendAsync("ActiveDevicesUpdated", new
            {
                activeDevices = activeDevs
            });
            await hubContext.Clients.Group("Admins").SendAsync("OnlineUsersUpdated", activeBuyers);
        }
        return Ok(ApiResponse<object?>.Ok(null, "Disconnected"));
    }

    /// <summary>
    /// Thống kê số lượng thiết bị đang hoạt động thực tế từ cơ sở dữ liệu Supabase
    /// </summary>
    [HttpGet("active-count")]
    [ProducesResponseType(typeof(ApiResponse<ActiveDevicesSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveDevicesSummary([FromQuery] int thresholdSeconds = 60)
    {
        var summary = await _deviceTrackingService.GetSummaryAsync(thresholdSeconds);
        return Ok(ApiResponse<ActiveDevicesSummaryDto>.Ok(summary));
    }
}
