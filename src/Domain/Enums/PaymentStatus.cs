namespace ZooGuide.Domain.Enums;

/// <summary>
/// Trạng thái thanh toán của đơn hàng vé
/// </summary>
public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Failed = 3,
    Expired = 4,
    Refunded = 5
}
