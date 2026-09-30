namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng CHAT_SESSIONS: Phiên hội thoại giữa du khách và hệ thống trợ lý ảo ZooGuide.
/// Gắn liền với TicketSession của khách tham quan.
/// </summary>
public class ChatSession
{
    public Guid ChatSessionId { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }

    // Navigation properties
    public virtual TicketSession TicketSession { get; set; } = null!;
    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
