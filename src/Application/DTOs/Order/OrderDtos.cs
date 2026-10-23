using System.ComponentModel.DataAnnotations;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.DTOs.Order;

public class CreateOrderRequest
{
    [Required]
    public int TicketTypeId { get; set; }

    [Range(1, 50, ErrorMessage = "Số lượng vé phải từ 1 đến 50.")]
    public int Quantity { get; set; } = 1;

    [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
    [StringLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ email.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ.")]
    [StringLength(100)]
    public string CustomerEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
    [Phone(ErrorMessage = "Số điện thoại không hợp lệ.")]
    [StringLength(20)]
    public string CustomerPhone { get; set; } = string.Empty;
}

public class OrderDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int TicketTypeId { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public string PaymentMethod { get; set; } = "VietQR";
    public string PaymentDescription { get; set; } = string.Empty;
    public string? QrCodeUrl { get; set; }
    public string? BankName { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountName { get; set; }
    public string? TransactionReference { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public List<IssuedTicketDto> IssuedTickets { get; set; } = new();
}

public class IssuedTicketDto
{
    public int TicketId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public string TicketTypeName { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public TicketStatus Status { get; set; }
}

public class OrderCheckoutResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public OrderDto? Order { get; set; }
}

public class PaymentWebhookPayload
{
    public string? Gateway { get; set; }
    public string? TransactionDate { get; set; }
    public string? AccountNumber { get; set; }
    public string? SubAccount { get; set; }
    public decimal TransferAmount { get; set; }
    public string? TransferType { get; set; }
    public string? Content { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Description { get; set; }
    public string? Code { get; set; }
}

public class SimulatePaymentRequest
{
    [Required]
    public string OrderCode { get; set; } = string.Empty;

    public decimal? Amount { get; set; }
}
