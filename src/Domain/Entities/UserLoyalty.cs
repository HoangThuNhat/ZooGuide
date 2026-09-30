namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng USER_LOYALTY: Lưu thông tin điểm thưởng và hạng thành viên hiện tại của User.
/// Quan hệ 1-1 với USERS (UserId vừa là PK vừa là FK).
/// </summary>
public class UserLoyalty
{
    public int UserId { get; set; }
    public int Points { get; set; } = 0;
    public int MembershipLevelId { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual MembershipLevel MembershipLevel { get; set; } = null!;
}
