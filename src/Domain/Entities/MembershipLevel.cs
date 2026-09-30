namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng MEMBERSHIP_LEVELS: Định nghĩa các hạng thành viên thân thiết (Đồng, Bạc, Vàng, Kim Cương).
/// Chuẩn bị cho tính năng tích điểm / khách hàng thân thiết tương lai.
/// </summary>
public class MembershipLevel
{
    public int MembershipLevelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MinPoints { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<UserLoyalty> UserLoyalties { get; set; } = new List<UserLoyalty>();
}
