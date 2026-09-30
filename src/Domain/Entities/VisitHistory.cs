namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng VISIT_HISTORY: Lưu lịch sử các chuyến tham quan của du khách có tài khoản.
/// ĐẶC ĐIỂM NGHIỆP VỤ:
/// - Chỉ tạo VisitHistory khi User đã đăng nhập hệ thống.
/// - Khách vãng lai (Anonymous) vẫn sử dụng bình thường qua TicketSession nhưng không ghi nhận VisitHistory.
/// - Làm nền tảng tính tổng số lần tham quan (TotalVisits) và tích điểm thành viên (Loyalty Points).
/// </summary>
public class VisitHistory
{
    public int VisitId { get; set; }
    public int UserId { get; set; }
    public int TicketId { get; set; }
    public Guid SessionId { get; set; }
    public DateTime VisitedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual TicketSession Session { get; set; } = null!;
}
