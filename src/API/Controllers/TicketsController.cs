using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketSessionService _ticketSessionService;

    public TicketsController(ITicketSessionService ticketSessionService)
    {
        _ticketSessionService = ticketSessionService;
    }

    /// <summary>
    /// Xác thực mã vé (QR/Barcode) từ du khách và khởi tạo phiên tham quan (Ticket Session)
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(TicketValidationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(TicketValidationResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(TicketValidationResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ValidateTicket([FromBody] ValidateTicketRequestDto request)
    {
        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.TicketCode))
        {
            return BadRequest(TicketValidationResponseDto.Fail("Vui lòng nhập mã vé hợp lệ.", "INVALID_INPUT"));
        }

        var result = await _ticketSessionService.ValidateTicketAsync(request);

        if (!result.Success)
        {
            var errorResponse = TicketValidationResponseDto.Fail(result.Message, result.ErrorCode);
            return StatusCode(result.StatusCode, errorResponse);
        }

        return Ok(TicketValidationResponseDto.Ok(result.Session!, result.Message));
    }

    /// <summary>
    /// Lấy danh sách các phiên tham quan (Dành cho trang Giám sát phiên tham quan của Ban Quản Lý)
    /// </summary>
    [HttpGet("sessions")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TicketSessionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions()
    {
        var sessions = await _ticketSessionService.GetAllSessionsAsync();
        return Ok(ApiResponse<IEnumerable<TicketSessionDto>>.Ok(sessions));
    }

    /// <summary>
    /// Đóng/thu hồi phiên tham quan cưỡng bức theo SessionId (Dành cho Quản trị viên)
    /// </summary>
    [HttpPost("sessions/{sessionId:guid}/revoke")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        bool revoked = await _ticketSessionService.RevokeSessionAsync(sessionId);
        if (!revoked)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy phiên tham quan với SessionId = {sessionId}."));
        }

        return Ok(ApiResponse<object>.Ok(new { sessionId }, "Đã đóng phiên tham quan của thiết bị thành công."));
    }
}
