using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng USERS: Đại diện cho người dùng có tài khoản trong hệ thống ZooGuide.
/// Phân quyền thông qua thuộc tính Role (Visitor, Staff, Admin).
/// Không lưu password dạng plaintext; bắt buộc lưu PasswordHash.
/// </summary>
public class User
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Visitor;
    public UserStatus Status { get; set; } = UserStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }

    // Navigation properties
    public virtual ICollection<TicketSession> TicketSessions { get; set; } = new List<TicketSession>();
    public virtual ICollection<VisitHistory> VisitHistories { get; set; } = new List<VisitHistory>();
    public virtual ICollection<Narration> NarrationsCreated { get; set; } = new List<Narration>();
    public virtual UserLoyalty? Loyalty { get; set; }
}
