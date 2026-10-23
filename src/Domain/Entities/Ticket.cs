using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng TICKETS: Lưu trữ vé tham quan được phát hành.
/// TicketCode là chuỗi duy nhất được mã hóa thành mã QR/barcode.
/// Vé chỉ được phát hành tự động sau khi backend xác nhận thanh toán đơn hàng thành công.
/// Admin không thể tạo vé thủ công.
/// </summary>
public class Ticket
{
    public int TicketId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public int TicketTypeId { get; set; }
    public int? OrderId { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.Valid;
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual TicketType TicketType { get; set; } = null!;
    public virtual TicketOrder? Order { get; set; }
    public virtual ICollection<TicketSession> TicketSessions { get; set; } = new List<TicketSession>();
    public virtual ICollection<VisitHistory> VisitHistories { get; set; } = new List<VisitHistory>();
}
