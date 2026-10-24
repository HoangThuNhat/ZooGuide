using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

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
    /// Lưu bản ghi kiểm tra sức khỏe thú y thực tế vào cơ sở dữ liệu
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

        return Ok(ApiResponse<DashboardHealthLogDto>.Ok(result, "Đã lưu hồ sơ khám sức khỏe thú y vào cơ sở dữ liệu!"));
    }
}
