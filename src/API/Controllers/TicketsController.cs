using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooGuide.API.Filters;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

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
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] int? ticketTypeId = null,
        [FromQuery] TicketStatus? status = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var tickets = await _ticketService.GetAllAsync(search, ticketTypeId, status, page, pageSize);
        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<TicketDto>> GetById(int id)
    {
        var ticket = await _ticketService.GetByIdAsync(id);
        if (ticket == null)
            return NotFound(new { message = "Ticket not found" });

        return Ok(ticket);
    }

    /// <summary>
    /// Admin phát hành vé trực tiếp / vé sự kiện tại quầy
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> Create([FromBody] TicketCreateRequest request)
    {
        try
        {
            var created = await _ticketService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.TicketId }, ApiResponse<TicketDto>.Ok(created, "Phát hành vé tham quan thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Fail($"Lỗi hệ thống khi phát hành vé: {ex.Message}"));
        }
    }

    /// <summary>
    /// Cập nhật thông tin vé đã tồn tại (hạn dùng, loại vé)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
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
    [Authorize(Roles = "Admin,Staff")]
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
    [Authorize(Roles = "Admin")]
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
    [AllowAnonymous]
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
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TicketSessionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions()
    {
        var sessions = await _ticketSessionService.GetAllSessionsAsync();
        return Ok(ApiResponse<IEnumerable<TicketSessionDto>>.Ok(sessions));
    }

    /// <summary>
    /// Đóng/thu hồi phiên tham quan theo SessionId (Dành cho Quản trị viên và Khách tham quan)
    /// </summary>
    [HttpPost("sessions/{sessionId:guid}/revoke")]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        bool revoked = await _ticketSessionService.RevokeSessionAsync(sessionId);
        if (!revoked)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy phiên tham quan với SessionId = {sessionId}."));
        }

        return Ok(ApiResponse<object>.Ok(new { sessionId }, "Đã kết thúc phiên tham quan thành công."));
    }

    /// <summary>
    /// Khách tham quan thoát phiên tham quan từ thiết bị (Nút Thoát vé bên trong thẻ điện tử)
    /// </summary>
    [HttpPost("sessions/exit")]
    [AllowAnonymous]
    public async Task<IActionResult> ExitSession([FromBody] ExitSessionRequest? request)
    {
        Guid targetSessionId = Guid.Empty;
        if (request != null && !string.IsNullOrWhiteSpace(request.SessionId) && Guid.TryParse(request.SessionId, out var parsed))
        {
            targetSessionId = parsed;
        }
        else if (HttpContext.Request.Headers.TryGetValue("X-Session-Id", out var headerId) && Guid.TryParse(headerId, out var parsedHeader))
        {
            targetSessionId = parsedHeader;
        }

        if (targetSessionId == Guid.Empty)
        {
            return BadRequest(ApiResponse<object>.Fail("Mã phiên tham quan (SessionId) không hợp lệ."));
        }

        bool revoked = await _ticketSessionService.RevokeSessionAsync(targetSessionId);
        if (!revoked)
        {
            return NotFound(ApiResponse<object>.Fail("Phiên tham quan không tồn tại hoặc đã kết thúc trước đó."));
        }

        return Ok(ApiResponse<object>.Ok(new { sessionId = targetSessionId }, "Đã thoát phiên tham quan thành công."));
    }

    /// <summary>
    /// Xuất ảnh mã QR dạng PNG trực tiếp từ máy chủ cho một vé tham quan
    /// </summary>
    [HttpGet("{ticketCode}/qr")]
    public async Task<IActionResult> GetTicketQrImage(string ticketCode, [FromServices] ZooGuideDbContext dbContext)
    {
        if (string.IsNullOrWhiteSpace(ticketCode))
            return BadRequest("Mã vé không hợp lệ.");

        var trimmedCode = ticketCode.Trim().ToUpper();
        var ticket = await dbContext.Tickets.AsNoTracking().FirstOrDefaultAsync(t => t.TicketCode.ToUpper() == trimmedCode);
        if (ticket == null)
            return NotFound("Không tìm thấy vé tham quan.");

        using var qrGenerator = new QRCoder.QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(ticket.TicketCode, QRCoder.QRCodeGenerator.ECCLevel.Q);
        using var pngQrCode = new QRCoder.PngByteQRCode(qrCodeData);
        byte[] qrCodeBytes = pngQrCode.GetGraphic(20);

        return File(qrCodeBytes, "image/png");
    }
}
