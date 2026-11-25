using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.Services;

/// <summary>
/// Xử lý nghiệp vụ xác thực vé, quản lý và kiểm tra thời hạn phiên tham quan (Ticket Session)
/// </summary>
public class TicketSessionService : ITicketSessionService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly ITicketSessionRepository _sessionRepository;

    public TicketSessionService(
        ITicketRepository ticketRepository, 
        ITicketSessionRepository sessionRepository)
    {
        _ticketRepository = ticketRepository;
        _sessionRepository = sessionRepository;
    }

    public async Task<TicketSession> CreateSessionAsync(int ticketId)
    {
        var ticket = await _ticketRepository.GetByIdWithDetailsAsync(ticketId);
        if (ticket == null) throw new ArgumentException("Ticket not found");

        int durationMinutes = ticket.TicketType?.DurationMinutes ?? 480;
        var startedAt = DateTime.UtcNow;
        var expiredAt = startedAt.AddMinutes(durationMinutes);

        var session = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = ticketId,
            UserId = null,
            StartedAt = startedAt,
            ExpiredAt = expiredAt,
            Status = SessionStatus.Active
        };

        return await _sessionRepository.AddAsync(session);
    }

    public async Task<(bool Success, string Message, TicketSessionDto? Session, int StatusCode, string? ErrorCode)> ValidateTicketAsync(
        ValidateTicketRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TicketCode))
        {
            return (false, "Vui lòng nhập mã vé hợp lệ.", null, 400, "INVALID_INPUT");
        }

        var normalizedCode = request.TicketCode.Trim().ToUpper();

        // 1. Tìm vé theo TicketCode trong cơ sở dữ liệu
        var ticket = await _ticketRepository.GetByCodeWithDetailsAsync(normalizedCode);

        // 2. Kiểm tra vé có tồn tại hay không
        if (ticket == null)
        {
            return (false, "Không tìm thấy vé trong hệ thống! Vui lòng kiểm tra lại mã in trên vé hoặc liên hệ quầy vé ZooGuide.", null, 404, "TICKET_NOT_FOUND");
        }

        var now = DateTime.UtcNow;

        // 3. Kiểm tra vé còn hiệu lực (ngày hiệu lực/hạn sử dụng)
        if (ticket.Status == TicketStatus.Expired || now > ticket.ValidUntil)
        {
            return (false, $"Vé {ticket.TicketCode} đã hết hạn sử dụng vào ngày {ticket.ValidUntil:yyyy-MM-dd}. Vui lòng đổi vé mới.", null, 400, "TICKET_EXPIRED");
        }

        if (now < ticket.ValidFrom)
        {
            return (false, $"Vé {ticket.TicketCode} chưa đến thời gian có hiệu lực ({ticket.ValidFrom:yyyy-MM-dd}).", null, 400, "TICKET_NOT_YET_VALID");
        }

        // 4. Kiểm tra vé không bị hủy, không bị cấm sử dụng và chưa được sử dụng
        if (ticket.Status == TicketStatus.Cancelled)
        {
            return (false, $"Vé {ticket.TicketCode} đã bị hủy trên hệ thống.", null, 400, "TICKET_CANCELLED");
        }

        if (ticket.Status == TicketStatus.Locked)
        {
            return (false, $"Vé {ticket.TicketCode} hiện đang bị tạm khóa. Vui lòng liên hệ ban quản lý ZooGuide.", null, 400, "TICKET_LOCKED");
        }

        if (ticket.Status == TicketStatus.Used || (ticket.TicketSessions != null && ticket.TicketSessions.Any(s => s.Status == SessionStatus.Active && s.ExpiredAt > now)))
        {
            return (false, $"Vé {ticket.TicketCode} đã được kích hoạt sử dụng trước đó.", null, 400, "TICKET_ALREADY_USED");
        }

        // 5. Tính thời gian hiệu lực phiên (ExpiresAt) theo cấu hình DurationMinutes của TicketType (mặc định 480 phút = 8 giờ)
        int durationMinutes = ticket.TicketType?.DurationMinutes ?? 480;
        var startedAt = DateTime.UtcNow;
        var expiresAt = startedAt.AddMinutes(durationMinutes);

        // Đánh dấu vé đã được quét sử dụng
        if (ticket.Status == TicketStatus.Valid)
        {
            ticket.Status = TicketStatus.Used;
            ticket.UsedAt ??= startedAt;
            ticket.UpdatedAt = startedAt;
            await _ticketRepository.UpdateAsync(ticket);
        }

        // 6. Tạo mới TicketSession gắn với vé
        var session = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = ticket.TicketId,
            UserId = null, // Khách vãng lai (hoặc có thể liên kết User nếu có)
            StartedAt = startedAt,
            ExpiredAt = expiresAt,
            Status = SessionStatus.Active
        };

        var createdSession = await _sessionRepository.AddAsync(session);

        // Map sang DTO trả kết quả đúng định dạng frontend mong đợi
        var sessionDto = new TicketSessionDto
        {
            SessionId = createdSession.SessionId.ToString(),
            TicketCode = ticket.TicketCode,
            CustomerName = "Khách tham quan",
            TicketType = ticket.TicketType?.Name ?? "Vé tham quan tiêu chuẩn",
            ValidDate = ticket.ValidUntil.ToString("yyyy-MM-dd"),
            ZonesAllowed = new List<string> { "ALL" },
            HasAudioGuide = true,
            ActivatedAt = startedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            ExpiresAt = expiresAt.ToString("yyyy-MM-dd HH:mm:ss"),
            Status = "Active",
            Device = request.Device ?? "Web Browser"
        };

        return (true, "Xác thực vé thành công! Phiên tham quan đã được mở khóa.", sessionDto, 200, null);
    }

    public static SessionStatus ResolveEffectiveStatus(TicketSession session, DateTime utcNow)
    {
        if (session.Status == SessionStatus.Revoked)
            return SessionStatus.Revoked;

        if (session.Status == SessionStatus.Ended)
            return SessionStatus.Ended;

        if (session.Status == SessionStatus.Expired)
            return SessionStatus.Expired;

        // Trạng thái trong DB là Active: kiểm tra điều kiện kết thúc & hết hạn thực tế
        if (session.EndedAt.HasValue)
            return SessionStatus.Ended;

        if (session.ExpiredAt <= utcNow)
            return SessionStatus.Expired;

        return SessionStatus.Active;
    }

    public async Task<TicketSession?> GetValidSessionAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdWithDetailsAsync(sessionId);
        if (session == null) return null;

        // Nếu trạng thái không phải Active hoặc đã có EndedAt
        if (session.Status != SessionStatus.Active || session.EndedAt.HasValue)
        {
            return null;
        }

        // Kiểm tra phiên đã hết hạn theo thời gian chưa
        if (session.ExpiredAt <= DateTime.UtcNow)
        {
            session.Status = SessionStatus.Expired;
            session.EndedAt = DateTime.UtcNow;
            await _sessionRepository.UpdateAsync(session);
            return null;
        }

        return session;
    }

    public async Task<IEnumerable<TicketSessionDto>> GetAllSessionsAsync(string? status = null, string? search = null)
    {
        var now = DateTime.UtcNow;
        var sessions = await _sessionRepository.GetAllWithDetailsAsync();

        var mapped = sessions.Select(s =>
        {
            var effectiveStatus = ResolveEffectiveStatus(s, now);
            var isInternalUser = s.User != null && (s.User.Role == UserRole.Admin || s.User.Role == UserRole.Staff);
            var customerName = !string.IsNullOrWhiteSpace(s.User?.FullName)
                ? s.User.FullName
                : (!string.IsNullOrWhiteSpace(s.Ticket?.Order?.CustomerName)
                    ? s.Ticket.Order.CustomerName
                    : "Khách tham quan");

            var startedUtc = DateTime.SpecifyKind(s.StartedAt, DateTimeKind.Utc);
            var expiredUtc = DateTime.SpecifyKind(s.ExpiredAt, DateTimeKind.Utc);
            DateTime? endedUtc = s.EndedAt.HasValue
                ? DateTime.SpecifyKind(s.EndedAt.Value, DateTimeKind.Utc)
                : null;

            return new TicketSessionDto
            {
                SessionId = s.SessionId.ToString(),
                TicketCode = s.Ticket?.TicketCode ?? string.Empty,
                CustomerName = customerName,
                TicketType = s.Ticket?.TicketType?.Name ?? "Vé tiêu chuẩn",
                ValidDate = s.Ticket?.ValidUntil.ToString("yyyy-MM-dd") ?? string.Empty,
                ZonesAllowed = new List<string> { "ALL" },
                HasAudioGuide = true,
                ActivatedAt = startedUtc.ToString("yyyy-MM-dd HH:mm:ss"),
                ExpiresAt = expiredUtc.ToString("yyyy-MM-dd HH:mm:ss"),
                EndedAt = endedUtc?.ToString("yyyy-MM-dd HH:mm:ss"),
                StartedAtUtc = startedUtc,
                ExpiredAtUtc = expiredUtc,
                EndedAtUtc = endedUtc,
                Status = effectiveStatus.ToString(),
                IsActive = effectiveStatus == SessionStatus.Active,
                IsInternalUser = isInternalUser,
                Device = "Web Browser"
            };
        });

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status.Trim(), "all", StringComparison.OrdinalIgnoreCase))
        {
            var targetStatus = status.Trim();
            mapped = mapped.Where(s => string.Equals(s.Status, targetStatus, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim();
            mapped = mapped.Where(s =>
                s.SessionId.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                s.TicketCode.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                s.CustomerName.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                s.TicketType.Contains(q, StringComparison.OrdinalIgnoreCase));
        }

        return mapped.ToList();
    }

    public async Task<bool> EndSessionAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdWithDetailsAsync(sessionId);
        if (session == null) return false;

        if (session.Status != SessionStatus.Active || session.EndedAt.HasValue)
        {
            return false;
        }

        var now = DateTime.UtcNow;
        if (session.ExpiredAt <= now)
        {
            session.Status = SessionStatus.Expired;
            session.EndedAt = now;
            await _sessionRepository.UpdateAsync(session);
            return false;
        }

        session.Status = SessionStatus.Ended;
        session.EndedAt = now;
        await _sessionRepository.UpdateAsync(session);
        return true;
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdWithDetailsAsync(sessionId);
        if (session == null) return false;

        // Nếu phiên đã kết thúc, thu hồi hoặc hết hạn trước đó thì không thực hiện lặp lại
        if (session.Status != SessionStatus.Active || session.EndedAt.HasValue)
        {
            return false;
        }

        var now = DateTime.UtcNow;
        if (session.ExpiredAt <= now)
        {
            session.Status = SessionStatus.Expired;
            session.EndedAt = now;
            await _sessionRepository.UpdateAsync(session);
            return false;
        }

        session.Status = SessionStatus.Revoked;
        session.EndedAt = now;
        await _sessionRepository.UpdateAsync(session);
        return true;
    }
}
