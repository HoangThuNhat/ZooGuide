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

    public async Task<TicketSession?> GetValidSessionAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdWithDetailsAsync(sessionId);
        if (session == null) return null;

        // Nếu trạng thái không phải Active
        if (session.Status != SessionStatus.Active)
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

    public async Task<IEnumerable<TicketSessionDto>> GetAllSessionsAsync()
    {
        var sessions = await _sessionRepository.GetAllWithDetailsAsync();
        return sessions.Select(s => new TicketSessionDto
        {
            SessionId = s.SessionId.ToString(),
            TicketCode = s.Ticket?.TicketCode ?? string.Empty,
            CustomerName = s.User?.FullName ?? "Khách tham quan",
            TicketType = s.Ticket?.TicketType?.Name ?? "Vé tiêu chuẩn",
            ValidDate = s.Ticket?.ValidUntil.ToString("yyyy-MM-dd") ?? string.Empty,
            ZonesAllowed = new List<string> { "ALL" },
            HasAudioGuide = true,
            ActivatedAt = s.StartedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            ExpiresAt = s.ExpiredAt.ToString("yyyy-MM-dd HH:mm:ss"),
            Status = s.Status.ToString(),
            Device = "Web Browser"
        });
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

        if (session.ExpiredAt <= DateTime.UtcNow)
        {
            session.Status = SessionStatus.Expired;
            session.EndedAt = DateTime.UtcNow;
            await _sessionRepository.UpdateAsync(session);
            return false;
        }

        session.Status = SessionStatus.Revoked;
        session.EndedAt = DateTime.UtcNow;
        await _sessionRepository.UpdateAsync(session);
        return true;
    }
}
