using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Filters;

/// <summary>
/// Attribute gắn vào các endpoint yêu cầu TicketSession hợp lệ
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireTicketSessionAttribute : TypeFilterAttribute
{
    public RequireTicketSessionAttribute() : base(typeof(RequireTicketSessionFilter))
    {
    }
}

/// <summary>
/// Filter thực thi kiểm tra phiên truy cập (SessionId) từ Header hoặc Query
/// </summary>
public class RequireTicketSessionFilter : IAsyncActionFilter
{
    private readonly ITicketSessionService _ticketSessionService;

    public RequireTicketSessionFilter(ITicketSessionService ticketSessionService)
    {
        _ticketSessionService = ticketSessionService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;

        // 1. Trích xuất SessionId từ các nguồn: Header X-Session-Id, Session-Id, Authorization hoặc Query parameter
        string? rawSessionId = null;

        if (httpContext.Request.Headers.TryGetValue("X-Session-Id", out var xSessionHeader))
        {
            rawSessionId = xSessionHeader.FirstOrDefault();
        }
        else if (httpContext.Request.Headers.TryGetValue("Session-Id", out var sessionHeader))
        {
            rawSessionId = sessionHeader.FirstOrDefault();
        }
        else if (httpContext.Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            var authVal = authHeader.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(authVal) && authVal.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                rawSessionId = authVal.Substring("Bearer ".Length).Trim();
            }
        }
        else if (httpContext.Request.Query.TryGetValue("sessionId", out var querySession))
        {
            rawSessionId = querySession.FirstOrDefault();
        }

        // 2. Kiểm tra nếu không có SessionId
        if (string.IsNullOrWhiteSpace(rawSessionId))
        {
            context.Result = new ObjectResult(new
            {
                success = false,
                errorCode = "SESSION_MISSING",
                message = "Yêu cầu phiên tham quan hợp lệ. Vui lòng quét mã vé để mở khóa tính năng này."
            })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        // 3. Kiểm tra định dạng GUID của SessionId
        if (!Guid.TryParse(rawSessionId, out var sessionGuid))
        {
            context.Result = new ObjectResult(new
            {
                success = false,
                errorCode = "SESSION_INVALID",
                message = "Mã phiên tham quan không đúng định dạng."
            })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        // 4. Kiểm tra phiên tồn tại và còn hiệu lực trong Database
        var session = await _ticketSessionService.GetValidSessionAsync(sessionGuid);
        if (session == null)
        {
            context.Result = new ObjectResult(new
            {
                success = false,
                errorCode = "SESSION_EXPIRED",
                message = "Phiên tham quan đã hết hạn hoặc không tồn tại. Vui lòng quét lại vé tham quan."
            })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        // 5. Lưu phiên vào HttpContext để controller có thể sử dụng nếu cần
        httpContext.Items["TicketSession"] = session;

        await next();
    }
}
