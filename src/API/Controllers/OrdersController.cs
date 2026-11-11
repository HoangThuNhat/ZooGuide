using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.DTOs.Order;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Khởi tạo đơn hàng mua vé trực tuyến và tạo mã thanh toán VietQR
    /// </summary>
    [HttpPost]
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Checkout([FromBody] CreateOrderRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu đơn hàng không hợp lệ. Vui lòng kiểm tra lại thông tin."));
        }

        try
        {
            var order = await _orderService.CreateOrderAsync(request);
            return Ok(ApiResponse<OrderDto>.Ok(order, "Đã khởi tạo đơn hàng và mã thanh toán QR thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Lỗi tạo đơn hàng: {ex.Message}"));
        }
    }

    /// <summary>
    /// Tra cứu chi tiết và trạng thái xác thực thanh toán thời gian thực theo mã đơn hàng
    /// </summary>
    [HttpGet("{orderCode}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByOrderCode(string orderCode)
    {
        var order = await _orderService.GetByOrderCodeAsync(orderCode);
        if (order == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy đơn hàng với mã '{orderCode}'."));
        }

        return Ok(ApiResponse<OrderDto>.Ok(order));
    }

    /// <summary>
    /// Gửi lại email xác nhận kèm mã QR cho đơn hàng đã thanh toán thành công
    /// </summary>
    [HttpPost("{orderCode}/resend-email")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResendEmail(string orderCode, [FromBody] ResendTicketEmailRequest? request = null)
    {
        try
        {
            var updatedOrder = await _orderService.ResendTicketEmailAsync(orderCode, request?.Email);
            var isSent = updatedOrder.EmailSent == true;
            var message = isSent 
                ? (updatedOrder.EmailStatusMessage ?? "Đã gửi lại email thành công.") 
                : (updatedOrder.EmailStatusMessage ?? "Chưa thể gửi email.");

            return Ok(ApiResponse<OrderDto>.Ok(updatedOrder, message));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Lỗi khi gửi lại email: {ex.Message}"));
        }
    }

    /// <summary>
    /// Danh sách tất cả đơn hàng (Hỗ trợ tìm kiếm, lọc trạng thái, phân trang máy chủ)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] PaymentStatus? status = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var orders = await _orderService.GetAllOrdersAsync(search, status, page, pageSize);
        return Ok(ApiResponse<IEnumerable<OrderDto>>.Ok(orders));
    }
}
