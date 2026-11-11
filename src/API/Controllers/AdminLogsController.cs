using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/admin/logs")]
[Authorize(Roles = "Admin")]
public class AdminLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AdminLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// Lấy danh sách nhật ký kiểm toán (Audit Logs) của Ban quản trị
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AuditLogEntryDto>>), StatusCodes.Status200OK)]
    public IActionResult GetLogs([FromQuery] int limit = 50)
    {
        var logs = _auditLogService.GetLogs(limit);
        return Ok(ApiResponse<IEnumerable<AuditLogEntryDto>>.Ok(logs));
    }
}
