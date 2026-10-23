using ZooGuide.Application.DTOs.Order;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(CreateOrderRequest request);
    Task<OrderDto?> GetByOrderCodeAsync(string orderCode);
    Task<IEnumerable<OrderDto>> GetAllOrdersAsync(string? search = null, PaymentStatus? status = null);
    Task<bool> ProcessPaymentWebhookAsync(PaymentWebhookPayload payload, string? signature = null);
    Task<OrderDto> SimulateSandboxPaymentAsync(SimulatePaymentRequest request);
}
