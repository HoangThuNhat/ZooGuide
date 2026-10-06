using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Application.Interfaces;

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
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetAll()
    {
        var tickets = await _ticketService.GetAllAsync();
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

    [HttpPost]
    public async Task<ActionResult<TicketDto>> Create([FromBody] TicketCreateRequest request)
    {
        try
        {
            var created = await _ticketService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.TicketId }, created);
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
            return BadRequest(response);
        }
        return Ok(response);
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
