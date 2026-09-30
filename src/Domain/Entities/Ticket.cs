using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng TICKETS: Lưu trữ vé tham quan được phát hành.
/// TicketCode là chuỗi duy nhất được mã hóa thành mã QR/barcode.
/// Không lưu file hình ảnh QR trong database (QR sinh động ở client/app dựa trên TicketCode).
/// Vé không phụ thuộc bắt buộc vào User vì khách tham quan vãng lai có thể dùng vé mà không cần đăng ký tài khoản.
/// </summary>
public class Ticket
{
    public int TicketId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public int TicketTypeId { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.Valid;
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual TicketType TicketType { get; set; } = null!;
    public virtual ICollection<TicketSession> TicketSessions { get; set; } = new List<TicketSession>();
    public virtual ICollection<VisitHistory> VisitHistories { get; set; } = new List<VisitHistory>();
}
