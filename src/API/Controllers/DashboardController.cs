using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Lấy toàn bộ số liệu thống kê vận hành thời gian thực từ cơ sở dữ liệu
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
    /// Lấy số lượng người mua vé và thiết bị đang hoạt động theo thời gian thực (được tính từ cơ sở dữ liệu và tracker)
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
        // Calculate active devices truthfully from persisted database heartbeats within 60 seconds
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
    /// Lưu bản ghi kiểm tra sức khỏe thú y thực tế vào cơ sở dữ liệu Supabase
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
