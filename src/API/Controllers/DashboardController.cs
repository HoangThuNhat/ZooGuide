using Microsoft.AspNetCore.Authorization;
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
[Authorize(Roles = "Admin,Staff")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Lấy toàn bộ số liệu thống kê giám sát hệ thống thuyết minh tự động đa ngôn ngữ
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStats([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
    {
        if (fromDate.HasValue && toDate.HasValue && fromDate.Value > toDate.Value)
        {
            return BadRequest(ApiResponse<DashboardStatsDto>.Fail("Ngày bắt đầu không được lớn hơn ngày kết thúc."));
        }

        var stats = await _dashboardService.GetStatsAsync(fromDate, toDate);
        return Ok(ApiResponse<DashboardStatsDto>.Ok(stats));
    }

    /// <summary>
    /// Ghi nhận sự kiện vận hành thực tế từ cổng khách tham quan (Audio, GPS Auto-Trigger, Ngôn ngữ)
    /// và phát thông báo thời gian thực qua SignalR cho Admin Dashboard
    /// </summary>
    [HttpPost("telemetry")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<TelemetryEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordTelemetryEvent(
        [FromBody] RecordTelemetryEventRequest request,
        [FromServices] IHubContext<OnlineTrackerHub>? hubContext = null)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.EventType))
        {
            return BadRequest(ApiResponse<TelemetryEventDto>.Fail("Thiếu thông tin loại sự kiện telemetry."));
        }

        var recorded = await _dashboardService.RecordTelemetryEventAsync(request);

        if (hubContext != null)
        {
            try
            {
                await hubContext.Clients.Group("Admins").SendAsync("DashboardTelemetryUpdated", new
                {
                    telemetryEventId = recorded.TelemetryEventId,
                    category = recorded.Category,
                    eventType = recorded.EventType,
                    languageCode = request.LanguageCode,
                    targetType = request.TargetType,
                    targetId = request.TargetId,
                    targetName = request.TargetName,
                    isSuccess = request.IsSuccess,
                    createdAt = recorded.CreatedAt
                });
            }
            catch
            {
                // Non-blocking SignalR broadcast
            }
        }

        return Ok(ApiResponse<TelemetryEventDto>.Ok(recorded, "Đã ghi nhận sự kiện vận hành."));
    }

    /// <summary>
    /// Kiểm tra chủ động 4 tầng tình trạng file âm thanh thuyết minh (URL, Tồn tại, Tải được, Giải mã phát được)
    /// </summary>
    [HttpPost("verify-audio")]
    [ProducesResponseType(typeof(ApiResponse<DashboardAudioVerificationSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyAudioStorage([FromQuery] bool forceRefresh = true)
    {
        var result = await _dashboardService.VerifyAudioStorageAsync(forceRefresh);
        return Ok(ApiResponse<DashboardAudioVerificationSummaryDto>.Ok(result, "Đã hoàn tất kiểm tra tình trạng file âm thanh thuyết minh."));
    }

    /// <summary>
    /// Cập nhật trạng thái xử lý cảnh báo vận hành (Chưa xử lý / Đang xử lý / Đã khắc phục)
    /// </summary>
    [HttpPatch("alerts/status")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateAlertStatus([FromBody] UpdateAlertStatusRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.AlertKey))
        {
            return BadRequest(ApiResponse<bool>.Fail("Thiếu mã cảnh báo cần cập nhật."));
        }

        var updated = await _dashboardService.UpdateAlertStatusAsync(request);
        return Ok(ApiResponse<bool>.Ok(updated, "Đã cập nhật trạng thái xử lý cảnh báo."));
    }

    /// <summary>
    /// Lấy số lượng người mua vé và thiết bị đang hoạt động theo thời gian thực
    /// </summary>
    [HttpGet("online-users")]
    [HttpGet("/api/admin/dashboard/online-users")]
    [ProducesResponseType(typeof(ApiResponse<OnlineUsersSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOnlineUsers(
        [FromServices] IOnlineUserTracker onlineTracker,
        [FromServices] ZooGuideDbContext dbContext)
    {
        var totalBuyers = await dbContext.TicketOrders
            .AsNoTracking()
            .Where(o => o.PaymentStatus == PaymentStatus.Paid && !string.IsNullOrEmpty(o.CustomerEmail))
            .Select(o => o.CustomerEmail.ToLower().Trim())
            .Distinct()
            .CountAsync();

        var totalSold = await dbContext.TicketOrders
            .AsNoTracking()
            .Where(o => o.PaymentStatus == PaymentStatus.Paid)
            .SumAsync(o => (int?)o.Quantity) ?? 0;

        var activeBuyers = onlineTracker.GetActiveTicketBuyersCount();
        var activeBuyerDevices = onlineTracker.GetActiveTicketBuyerDevicesCount();
        var activeDevices = await dbContext.DeviceActivities
            .AsNoTracking()
            .CountAsync(d => d.LastSeenAt >= DateTime.UtcNow.AddSeconds(-60));
        var activeConnections = onlineTracker.GetActiveBuyerConnectionsCount();

        var summary = new OnlineUsersSummaryDto
        {
            ActiveTicketBuyerDevices = activeBuyerDevices,
            ActiveTicketBuyers = activeBuyers,
            ActiveDevices = activeDevices,
            ActiveBuyerConnections = activeConnections,
            TotalTicketBuyers = totalBuyers,
            TotalTicketsSold = totalSold,
            OnlineUsers = activeBuyers,
            ActiveConnections = activeConnections,
            CalculatedAtUtc = DateTime.UtcNow
        };
        return Ok(ApiResponse<OnlineUsersSummaryDto>.Ok(summary));
    }

    /// <summary>
    /// Lưu bản ghi kiểm tra sức khỏe thú y thực tế vào cơ sở dữ liệu Supabase (giữ tương thích ngược)
    /// </summary>
    [HttpPost("health-logs")]
    [ProducesResponseType(typeof(ApiResponse<DashboardHealthLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DashboardHealthLogDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<DashboardHealthLogDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordHealthCheck([FromBody] UpdateAnimalHealthDto dto)
    {
        if (dto.AnimalId <= 0)
        {
            return BadRequest(ApiResponse<DashboardHealthLogDto>.Fail("Vui lòng chọn cá thể động vật hợp lệ."));
        }

        var result = await _dashboardService.RecordHealthCheckAsync(dto);
        if (result == null)
        {
            return NotFound(ApiResponse<DashboardHealthLogDto>.Fail($"Không tìm thấy cá thể động vật ID = {dto.AnimalId}."));
        }

        return Ok(ApiResponse<DashboardHealthLogDto>.Ok(result, "Đã lưu bản ghi kiểm tra sức khỏe cá thể thành công."));
    }
}
