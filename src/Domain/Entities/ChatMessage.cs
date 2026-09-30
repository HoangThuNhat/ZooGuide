using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng CHAT_MESSAGES: Tin nhắn chi tiết trong phiên hội thoại chatbot.
/// </summary>
public class ChatMessage
{
    public long MessageId { get; set; }
    public Guid ChatSessionId { get; set; }
    public ChatSenderType SenderType { get; set; } = ChatSenderType.Visitor;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ChatSession ChatSession { get; set; } = null!;
}
