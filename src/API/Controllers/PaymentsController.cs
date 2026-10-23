using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.DTOs.Order;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IOrderService _orderService;

    public PaymentsController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Webhook tiếp nhận thông báo thanh toán tự động từ cổng thanh toán (SePay / VietQR Webhook)
    /// Đảm bảo tính Idempotent và xác thực bảo mật từ phía server.
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook([FromBody] PaymentWebhookPayload payload)
    {
        // Lấy token xác thực từ Header Authorization hoặc X-Webhook-Secret nếu có
        string? signature = Request.Headers["Authorization"].FirstOrDefault() ?? Request.Headers["X-Webhook-Secret"].FirstOrDefault();
        if (signature != null && signature.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            signature = signature.Substring("Bearer ".Length).Trim();
        }

        var success = await _orderService.ProcessPaymentWebhookAsync(payload, signature);
        if (!success)
        {
            return BadRequest(new { success = false, message = "Xác minh webhook giao dịch thanh toán thất bại hoặc không hợp lệ." });
        }

        return Ok(new { success = true, message = "Xác nhận thanh toán và tự động phát hành vé thành công." });
    }

    /// <summary>
    /// Giả lập thanh toán Sandbox phục vụ kiểm thử logic (Kịch bản kiểm thử 6.1 & 9.3)
    /// </summary>
    [HttpPost("simulate")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SimulatePayment([FromBody] SimulatePaymentRequest request)
    {
        try
        {
            var updatedOrder = await _orderService.SimulateSandboxPaymentAsync(request);
            return Ok(ApiResponse<OrderDto>.Ok(updatedOrder, "Đã hoàn tất thanh toán sandbox và tự động phát hành mã vé tham quan."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Lỗi xử lý thanh toán sandbox: {ex.Message}"));
        }
    }
}
