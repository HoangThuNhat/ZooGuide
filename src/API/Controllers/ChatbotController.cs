using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbotService;
    private readonly ITicketSessionService _ticketSessionService;
    private readonly IGuestChatLimiterService _limiterService;

    public ChatbotController(
        IChatbotService chatbotService,
        ITicketSessionService ticketSessionService,
        IGuestChatLimiterService limiterService)
    {
        _chatbotService = chatbotService;
        _ticketSessionService = ticketSessionService;
        _limiterService = limiterService;
    }

    /// <summary>
    /// Kiểm tra trạng thái quyền sử dụng Chatbot (khách vãng lai hay có vé hợp lệ, số câu hỏi còn lại)
    /// </summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(ApiResponse<ChatbotStatusResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus([FromQuery] string? sessionId = null)
    {
        var (isValidTicket, _) = await CheckTicketSessionAsync(sessionId);
        if (isValidTicket)
        {
            return Ok(ApiResponse<ChatbotStatusResponseDto>.Ok(new ChatbotStatusResponseDto
            {
                HasValidTicket = true,
                RemainingQuestions = -1,
                MaxQuestions = -1,
                IsLimitReached = false,
                Message = "Vé tham quan hợp lệ. Quý khách được sử dụng trợ lý ảo ZooBot đầy đủ."
            }));
        }

        var guestId = GetOrSetGuestId();
        var quota = _limiterService.GetQuota(guestId);

        return Ok(ApiResponse<ChatbotStatusResponseDto>.Ok(new ChatbotStatusResponseDto
        {
            HasValidTicket = false,
            RemainingQuestions = quota.remaining,
            MaxQuestions = 3,
            IsLimitReached = quota.isLimitReached,
            Message = quota.isLimitReached
                ? "Bạn đã sử dụng hết 3 câu hỏi miễn phí. Vui lòng kích hoạt vé tham quan hợp lệ để tiếp tục sử dụng chatbot."
                : $"Bạn còn {quota.remaining}/3 câu hỏi miễn phí."
        }));
    }

    /// <summary>
    /// Gửi câu hỏi đến ZooBot — Trợ lý ảo sử dụng dữ liệu thực tế từ cơ sở dữ liệu
    /// </summary>
    [HttpPost("message")]
    [ProducesResponseType(typeof(ApiResponse<ChatbotQueryResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendMessage([FromBody] ChatbotQueryRequestDto request)
    {
        var timestamp = DateTime.Now.ToString("HH:mm");

        // 1. Kiểm tra tin nhắn rỗng (không tính lượt nếu rỗng)
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return Ok(ApiResponse<ChatbotQueryResponseDto>.Ok(new ChatbotQueryResponseDto
            {
                Reply = "Quý khách vui lòng nhập câu hỏi để ZooBot có thể hỗ trợ.",
                Timestamp = timestamp,
                FoundData = false,
                SourceType = "InvalidInput",
                HasValidTicket = false,
                RemainingQuestions = 0,
                MaxQuestions = 3,
                IsLimitReached = false
            }));
        }

        // 2. Xác thực TicketSession thực tế từ CSDL
        var (isValidTicket, validSession) = await CheckTicketSessionAsync(request.SessionId);

        // Trường hợp 1: Người có vé hợp lệ và phiên đang Active
        if (isValidTicket)
        {
            var response = await _chatbotService.ProcessMessageAsync(request);
            response.HasValidTicket = true;
            response.RemainingQuestions = -1;
            response.MaxQuestions = -1;
            response.IsLimitReached = false;
            return Ok(ApiResponse<ChatbotQueryResponseDto>.Ok(response));
        }

        // Trường hợp 2: Khách chưa có vé, vé hết hạn hoặc phiên bị thu hồi -> Áp dụng giới hạn 3 câu miễn phí
        var guestId = GetOrSetGuestId();
        var consumption = _limiterService.TryConsume(guestId, request.Message);

        if (!consumption.allowed)
        {
            return Ok(ApiResponse<ChatbotQueryResponseDto>.Ok(new ChatbotQueryResponseDto
            {
                Reply = "Bạn đã sử dụng hết 3 câu hỏi miễn phí. Vui lòng kích hoạt vé tham quan hợp lệ để tiếp tục sử dụng chatbot.",
                Timestamp = timestamp,
                FoundData = false,
                SourceType = "LimitReached",
                HasValidTicket = false,
                RemainingQuestions = 0,
                MaxQuestions = 3,
                IsLimitReached = true
            }));
        }

        // Nếu còn lượt câu hỏi hợp lệ:
        var guestResponse = await _chatbotService.ProcessMessageAsync(request);
        guestResponse.HasValidTicket = false;
        guestResponse.RemainingQuestions = consumption.remaining;
        guestResponse.MaxQuestions = 3;
        guestResponse.IsLimitReached = (consumption.remaining <= 0);

        return Ok(ApiResponse<ChatbotQueryResponseDto>.Ok(guestResponse));
    }

    private async Task<(bool isValid, Domain.Entities.TicketSession? session)> CheckTicketSessionAsync(string? rawSessionId)
    {
        string? candidate = rawSessionId;
        if (string.IsNullOrWhiteSpace(candidate))
        {
            if (Request.Headers.TryGetValue("X-Session-Id", out var xSessionHeader))
            {
                candidate = xSessionHeader.FirstOrDefault();
            }
            else if (Request.Headers.TryGetValue("Session-Id", out var sessionHeader))
            {
                candidate = sessionHeader.FirstOrDefault();
            }
        }

        if (string.IsNullOrWhiteSpace(candidate) || !Guid.TryParse(candidate, out var sessionGuid))
        {
            return (false, null);
        }

        var session = await _ticketSessionService.GetValidSessionAsync(sessionGuid);
        return (session != null, session);
    }

    private string GetOrSetGuestId()
    {
        const string cookieName = "zooguide_guest_id";
        if (Request.Cookies.TryGetValue(cookieName, out var cookieVal) && !string.IsNullOrWhiteSpace(cookieVal))
        {
            return cookieVal.Trim();
        }

        if (Request.Headers.TryGetValue("X-Guest-Id", out var headerVal) && !string.IsNullOrWhiteSpace(headerVal))
        {
            var guestFromHeader = headerVal.FirstOrDefault()?.Trim();
            if (!string.IsNullOrEmpty(guestFromHeader))
            {
                SetGuestCookie(guestFromHeader);
                return guestFromHeader;
            }
        }

        var newGuestId = Guid.NewGuid().ToString("N");
        SetGuestCookie(newGuestId);
        return newGuestId;
    }

    private void SetGuestCookie(string guestId)
    {
        try
        {
            Response.Cookies.Append("zooguide_guest_id", guestId, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(30)
            });
        }
        catch
        {
            // Ignore cookie append issues if response already started
        }
    }
}

