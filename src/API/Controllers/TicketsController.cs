using Microsoft.AspNetCore.Mvc;
using ZooGuide.API.Filters;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly ITicketSessionService _ticketSessionService;

    public TicketsController(
        ITicketService ticketService, 
        ITicketSessionService ticketSessionService)
    {
        _ticketService = ticketService;
        _ticketSessionService = ticketSessionService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] int? ticketTypeId = null,
        [FromQuery] TicketStatus? status = null)
    {
        var tickets = await _ticketService.GetAllAsync(search, ticketTypeId, status);
        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TicketDto>> GetById(int id)
    {
        var ticket = await _ticketService.GetByIdAsync(id);
        if (ticket == null)
            return NotFound(new { message = "Ticket not found" });

        return Ok(ticket);
    }

    /// <summary>
    /// Vô hiệu hóa phát hành vé thủ công (Nghiệp vụ 5.1).
    /// Vé tham quan chỉ được phát hành tự động sau khi thanh toán QR thành công.
    /// </summary>
    [HttpPost]
    public IActionResult CreateDisabled()
    {
        return StatusCode(StatusCodes.Status405MethodNotAllowed, ApiResponse<object>.Fail(
            "Chức năng phát hành vé thủ công đã bị vô hiệu hóa hoàn toàn theo quy định nghiệp vụ mới. " +
            "Vé tham quan chỉ được hệ thống tự động cấp phát sau khi backend xác thực giao dịch thanh toán QR thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin vé đã tồn tại (hạn dùng, loại vé)
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TicketDto>> Update(int id, [FromBody] TicketUpdateRequest request)
    {
        try
        {
            var updated = await _ticketService.UpdateAsync(id, request);
            if (updated == null)
                return NotFound(new { message = "Ticket not found" });

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Admin cập nhật trạng thái quản lý / sử dụng của vé (Valid, Used, Expired, Cancelled, Locked) (Nghiệp vụ 5.2 & 5.3)
    /// </summary>
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] TicketStatus status)
    {
        try
        {
            var updated = await _ticketService.UpdateStatusAsync(id, status);
            if (updated == null)
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy vé cần cập nhật trạng thái."));

            return Ok(ApiResponse<TicketDto>.Ok(updated, $"Đã cập nhật trạng thái vé sang: {status}"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Xóa hoặc thu hồi vé khi chưa được sử dụng
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _ticketService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = "Ticket not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xác thực mã vé (QR/Barcode) từ du khách và khởi tạo phiên tham quan (Ticket Session)
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ValidateTicketResponse>> Validate([FromBody] ValidateTicketRequest request)
    {
        var response = await _ticketService.ValidateAsync(request);
        if (!response.Valid)
        {
            if (response.ErrorCode == "TICKET_NOT_FOUND")
            {
                return NotFound(response);
            }
            return BadRequest(response);
        }
        return Ok(response);
    }

    /// <summary>
    /// Kiểm tra tính hợp lệ của phiên tham quan hiện tại (Yêu cầu Header X-Session-Id hoặc Session-Id)
    /// </summary>
    [HttpGet("sessions/verify")]
    [RequireTicketSession]
    public IActionResult VerifySession()
    {
        var session = HttpContext.Items["TicketSession"] as ZooGuide.Domain.Entities.TicketSession;
        return Ok(ApiResponse<object>.Ok(new
        {
            valid = true,
            sessionId = session?.SessionId,
            expiresAt = session?.ExpiredAt,
            message = "Phiên tham quan hợp lệ và đang hoạt động."
        }));
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
