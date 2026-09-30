using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng TICKET_SESSIONS: Lưu phiên truy cập ZooGuide được kích hoạt sau khi vé hợp lệ được quét.
/// Ý NGHĨA NGHIỆP VỤ QUAN TRỌNG:
/// - Khách vãng lai (không đăng nhập): Ticket -> TicketSession -> UserId = NULL.
/// - Khách có đăng nhập: User -> TicketSession -> UserId = UserId.
/// - Cho phép mở khóa các tính năng như Bản đồ GPS, Thuyết minh âm thanh, Chatbot.
/// - Cập nhật vị trí GPS gần nhất của phiên (LastLatitude, LastLongitude, LastLocationAt).
/// </summary>
public class TicketSession
{
    public Guid SessionId { get; set; } = Guid.NewGuid();
    public int TicketId { get; set; }
    public int? UserId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiredAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public SessionStatus Status { get; set; } = SessionStatus.Active;
    public decimal? LastLatitude { get; set; }
    public decimal? LastLongitude { get; set; }
    public DateTime? LastLocationAt { get; set; }

    // Navigation properties
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual User? User { get; set; }
    public virtual ICollection<VisitHistory> VisitHistories { get; set; } = new List<VisitHistory>();
    public virtual ICollection<LocationLog> LocationLogs { get; set; } = new List<LocationLog>();
    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
}
