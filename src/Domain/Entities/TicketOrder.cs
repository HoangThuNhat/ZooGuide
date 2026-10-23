using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng TICKET_ORDERS: Quản lý đơn hàng mua vé trực tuyến và trạng thái thanh toán QR.
/// Đảm bảo tính toàn vẹn tài chính, tách biệt rõ ràng giữa Trạng thái thanh toán (PaymentStatus)
/// và Trạng thái sử dụng vé (TicketStatus).
/// </summary>
public class TicketOrder
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int TicketTypeId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string PaymentMethod { get; set; } = "VietQR";
    public string PaymentDescription { get; set; } = string.Empty;
    public string? TransactionReference { get; set; }
    public string? QrCodeUrl { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(15);

    // Navigation properties
    public virtual TicketType TicketType { get; set; } = null!;
    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
