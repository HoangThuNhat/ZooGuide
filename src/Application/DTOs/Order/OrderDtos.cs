using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.DTOs.Order;

public class OrderItemRequest
{
    public int TicketTypeId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class CreateOrderRequest
{
    public int TicketTypeId { get; set; }

    public int Quantity { get; set; } = 1;

    public List<OrderItemRequest>? Items { get; set; }

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

    public int GetEffectiveTicketTypeId()
    {
        if (TicketTypeId > 0) return TicketTypeId;
        if (Items != null && Items.Count > 0 && Items[0].TicketTypeId > 0) return Items[0].TicketTypeId;
        return 0;
    }

    public int GetEffectiveQuantity()
    {
        if (Quantity > 0 && TicketTypeId > 0) return Quantity;
        if (Items != null && Items.Count > 0 && Items[0].Quantity > 0) return Items[0].Quantity;
        return Quantity > 0 ? Quantity : 1;
    }
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
    public bool? EmailSent { get; set; }
    public string? EmailStatusMessage { get; set; }
    public List<IssuedTicketDto> IssuedTickets { get; set; } = new();

    /// <summary>
    /// Đồng bộ trường Tickets tương thích với frontend client
    /// </summary>
    public List<IssuedTicketDto> Tickets
    {
        get => IssuedTickets;
        set => IssuedTickets = value;
    }
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

    /// <summary>
    /// Cho phép mô phỏng thanh toán thất bại phục vụ kiểm thử (Kịch bản 7.3)
    /// </summary>
    public bool? FailSimulation { get; set; }
}

public class ResendTicketEmailRequest
{
    [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ.")]
    public string? Email { get; set; }
}
