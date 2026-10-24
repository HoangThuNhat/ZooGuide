using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

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
    public async Task<IActionResult> Heartbeat([FromBody] DeviceHeartbeatRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.InstallationId))
        {
            return BadRequest(ApiResponse<DeviceHeartbeatResponseDto>.Fail("InstallationId không được để trống."));
        }

        var userAgent = Request.Headers["User-Agent"].ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _deviceTrackingService.RecordHeartbeatAsync(request.InstallationId, userAgent, ipAddress);
        return Ok(ApiResponse<DeviceHeartbeatResponseDto>.Ok(result));
    }

    /// <summary>
    /// Thống kê số lượng thiết bị đang hoạt động thực tế (5 phút gần nhất)
    /// </summary>
    [HttpGet("active-count")]
    [ProducesResponseType(typeof(ApiResponse<ActiveDevicesSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveDevicesSummary()
    {
        var summary = await _deviceTrackingService.GetSummaryAsync();
        return Ok(ApiResponse<ActiveDevicesSummaryDto>.Ok(summary));
    }
}
