using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs.Order;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class OrderService : IOrderService
{
    private static readonly SemaphoreSlim _webhookLock = new(1, 1);
    private readonly ZooGuideDbContext _context;
    private readonly ITicketService _ticketService;
    private readonly IEmailService? _emailService;

    // Cấu hình ngân hàng VietQR mặc định (hỗ trợ ghi đè qua biến môi trường)
    private static string BankId => Environment.GetEnvironmentVariable("VIETQR_BANK_ID") ?? "MB";
    private static string BankNameDisplay => Environment.GetEnvironmentVariable("VIETQR_BANK_NAME") ?? "MBBank (Ngân hàng TMCP Quân Đội)";
    private static string AccountNumber => Environment.GetEnvironmentVariable("VIETQR_ACCOUNT_NUMBER") ?? "0988888888";
    private static string AccountName => Environment.GetEnvironmentVariable("VIETQR_ACCOUNT_NAME") ?? "CONG TY TNHH MTV THAO CAM VIEN SAI GON";
    private static string WebhookSecret => Environment.GetEnvironmentVariable("PAYMENT_WEBHOOK_SECRET") ?? "ZooGuideSecKey2026";

    public OrderService(ZooGuideDbContext context, ITicketService ticketService, IEmailService? emailService = null)
    {
        _context = context;
        _ticketService = ticketService;
        _emailService = emailService;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));

        var effectiveTicketTypeId = request.GetEffectiveTicketTypeId();
        var effectiveQuantity = request.GetEffectiveQuantity();

        if (effectiveTicketTypeId <= 0)
        {
            throw new ArgumentException("Hạng vé tham quan không tồn tại hoặc không hợp lệ.");
        }

        if (effectiveQuantity <= 0 || effectiveQuantity > 50)
        {
            throw new ArgumentException("Số lượng vé phải từ 1 đến 50.");
        }

        var ticketType = await _context.TicketTypes.FindAsync(effectiveTicketTypeId);
        if (ticketType == null || !ticketType.IsActive)
        {
            throw new ArgumentException("Hạng vé tham quan không tồn tại hoặc đã ngừng cung cấp.");
        }

        // Giá vé lấy tuyệt đối từ cơ sở dữ liệu phía máy chủ (Nguyên tắc bảo mật 6.2)
        var unitPrice = ticketType.Price;
        var totalAmount = unitPrice * effectiveQuantity;

        // Sinh mã đối soát chuyển khoản duy nhất và mã đơn hàng ngẫu nhiên an toàn
        var randSuffix = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var orderCode = $"ZG-{DateTime.UtcNow:yyyyMMdd}-{randSuffix}";
        var paymentDescription = $"ZG{randSuffix}";

        // Chuẩn hóa link VietQR NAPAS
        var encodedDesc = Uri.EscapeDataString(paymentDescription);
        var encodedAccName = Uri.EscapeDataString(AccountName);
        var qrCodeUrl = $"https://img.vietqr.io/image/{BankId}-{AccountNumber}-compact2.png?amount={(long)totalAmount}&addInfo={encodedDesc}&accountName={encodedAccName}";

        var order = new TicketOrder
        {
            OrderCode = orderCode,
            CustomerName = request.CustomerName.Trim(),
            CustomerEmail = request.CustomerEmail.Trim().ToLower(),
            CustomerPhone = request.CustomerPhone.Trim(),
            TicketTypeId = ticketType.TicketTypeId,
            Quantity = effectiveQuantity,
            UnitPrice = unitPrice,
            TotalAmount = totalAmount,
            PaymentStatus = PaymentStatus.Pending,
            PaymentMethod = "VietQR",
            PaymentDescription = paymentDescription,
            QrCodeUrl = qrCodeUrl,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // Giữ đơn trong 15 phút
        };

        _context.TicketOrders.Add(order);
        await _context.SaveChangesAsync();

        return MapToDto(order, ticketType, new List<Ticket>());
    }

    public async Task<OrderDto?> GetByOrderCodeAsync(string orderCode)
    {
        if (string.IsNullOrWhiteSpace(orderCode)) return null;

        var normalizedCode = orderCode.Trim().ToUpper();
        var order = await _context.TicketOrders
            .Include(o => o.TicketType)
            .Include(o => o.Tickets)
            .FirstOrDefaultAsync(o => o.OrderCode.ToUpper() == normalizedCode || o.PaymentDescription.ToUpper() == normalizedCode);

        if (order == null) return null;

        // Tự động kiểm tra hết hạn nếu đang Pending và quá thời gian
        if (order.PaymentStatus == PaymentStatus.Pending && DateTime.UtcNow > order.ExpiresAt)
        {
            order.PaymentStatus = PaymentStatus.Expired;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return MapToDto(order, order.TicketType, order.Tickets?.ToList() ?? new List<Ticket>());
    }

    public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync(string? search = null, PaymentStatus? status = null, int? page = null, int? pageSize = null)
    {
        var query = _context.TicketOrders
            .Include(o => o.TicketType)
            .Include(o => o.Tickets)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(o => 
                o.OrderCode.ToLower().Contains(term) ||
                o.PaymentDescription.ToLower().Contains(term) ||
                o.CustomerName.ToLower().Contains(term) ||
                o.CustomerEmail.ToLower().Contains(term) ||
                o.CustomerPhone.ToLower().Contains(term)
            );
        }

        if (status.HasValue)
        {
            query = query.Where(o => o.PaymentStatus == status.Value);
        }

        query = query.OrderByDescending(o => o.CreatedAt);

        if (page.HasValue && pageSize.HasValue)
        {
            var p = Math.Max(1, page.Value);
            var ps = Math.Clamp(pageSize.Value, 1, 100);
            query = query.Skip((p - 1) * ps).Take(ps);
        }

        var list = await query.ToListAsync();
        return list.Select(o => MapToDto(o, o.TicketType, o.Tickets?.ToList() ?? new List<Ticket>()));
    }

    public async Task<bool> ProcessPaymentWebhookAsync(PaymentWebhookPayload payload, string? signature = null)
    {
        if (payload == null) return false;

        // 1. Kiểm tra Webhook Secret/Signature (từ chối nếu truyền chuỗi rỗng hoặc sai chữ ký)
        if (signature != null && (string.IsNullOrWhiteSpace(signature) || signature != WebhookSecret))
        {
            Console.WriteLine("Warning: Invalid payment webhook secret signature.");
            return false;
        }

        // 2. Tìm mã đơn hàng từ nội dung chuyển khoản
        var content = (payload.Content ?? payload.Description ?? "").ToUpper();
        if (string.IsNullOrWhiteSpace(content)) return false;

        await _webhookLock.WaitAsync();
        try
        {
            var order = await _context.TicketOrders
                .Include(o => o.TicketType)
                .Include(o => o.Tickets)
                .FirstOrDefaultAsync(o => content.Contains(o.PaymentDescription.ToUpper()) || content.Contains(o.OrderCode.ToUpper()));

            if (order == null)
            {
                Console.WriteLine("Webhook note: No matching order found for incoming transfer notification.");
                return false;
            }

            // 3. Idempotency: Nếu đơn hàng đã hoàn tất, xác nhận 200 OK ngay để tránh webhook gửi lại sinh thừa vé
            if (order.PaymentStatus == PaymentStatus.Paid)
            {
                return true;
            }

            // 3b. Kiểm tra đơn hàng đã quá thời hạn thanh toán (15 phút) hoặc đã bị hủy/hoàn tiền
            if (order.PaymentStatus == PaymentStatus.Expired ||
                order.PaymentStatus == PaymentStatus.Refunded ||
                (order.PaymentStatus == PaymentStatus.Pending && DateTime.UtcNow > order.ExpiresAt))
            {
                if (order.PaymentStatus == PaymentStatus.Pending)
                {
                    order.PaymentStatus = PaymentStatus.Expired;
                    order.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                Console.WriteLine($"Webhook rejected: Order {order.OrderCode} has expired or is not eligible for payment.");
                return false;
            }

            // 4. Đối soát số tiền giao dịch: Số tiền thanh toán phải lớn hơn hoặc bằng tổng tiền đơn
            if (payload.TransferAmount < order.TotalAmount)
            {
                Console.WriteLine($"Webhook error: Insufficient transfer amount for order {order.OrderCode}.");
                order.PaymentStatus = PaymentStatus.Failed;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return false;
            }

            // 5. Cập nhật trạng thái đơn hàng thành Paid và tự động phát hành vé điện tử an toàn
            var previousStatus = order.PaymentStatus;
            order.PaymentStatus = PaymentStatus.Paid;
            order.PaidAt = DateTime.UtcNow;
            order.TransactionReference = payload.ReferenceCode ?? payload.Code ?? $"TXN-{Guid.NewGuid():N}";
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            try
            {
                // 6. Tự động phát hành vé điện tử cho đơn hàng
                await _ticketService.IssueTicketsForOrderAsync(order.OrderId);
            }
            catch
            {
                // Rollback trạng thái đơn nếu quá trình phát hành vé gặp sự cố (PRD UC05 Exception E4)
                order.PaymentStatus = previousStatus;
                order.PaidAt = null;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                throw;
            }

            return true;
        }
        finally
        {
            _webhookLock.Release();
        }
    }

    public async Task<OrderDto> SimulateSandboxPaymentAsync(SimulatePaymentRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.OrderCode))
        {
            throw new ArgumentException("Mã đơn hàng không hợp lệ.");
        }

        await _webhookLock.WaitAsync();
        try
        {
            var normalizedCode = request.OrderCode.Trim().ToUpper();
            var order = await _context.TicketOrders
                .Include(o => o.TicketType)
                .Include(o => o.Tickets)
                .FirstOrDefaultAsync(o => o.OrderCode.ToUpper() == normalizedCode || o.PaymentDescription.ToUpper() == normalizedCode);

            if (order == null)
            {
                throw new ArgumentException($"Không tìm thấy đơn hàng {request.OrderCode}.");
            }

            if (order.PaymentStatus == PaymentStatus.Paid)
            {
                var existingTickets = await _context.Tickets
                    .Where(t => t.OrderId == order.OrderId)
                    .ToListAsync();
                return MapToDto(order, order.TicketType, existingTickets);
            }

            // Kiểm tra đơn hàng đã quá thời hạn giữ chỗ (15 phút)
            if (order.PaymentStatus == PaymentStatus.Expired ||
                (order.PaymentStatus == PaymentStatus.Pending && DateTime.UtcNow > order.ExpiresAt))
            {
                if (order.PaymentStatus != PaymentStatus.Expired)
                {
                    order.PaymentStatus = PaymentStatus.Expired;
                    order.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                throw new InvalidOperationException($"Đơn hàng {order.OrderCode} đã quá thời hạn thanh toán (15 phút). Không có vé nào được phát hành.");
            }

            // Mô phỏng thất bại phục vụ kiểm thử
            if (request.FailSimulation == true)
            {
                order.PaymentStatus = PaymentStatus.Failed;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                throw new InvalidOperationException("Giao dịch thanh toán sandbox thất bại (mô phỏng lỗi giao dịch). Không có vé nào được phát hành.");
            }

            var amount = request.Amount ?? order.TotalAmount;
            if (amount < order.TotalAmount)
            {
                throw new InvalidOperationException($"Số tiền giả lập ({amount:N0} đ) không đủ so với giá trị đơn hàng ({order.TotalAmount:N0} đ).");
            }

            var previousStatus = order.PaymentStatus;
            order.PaymentStatus = PaymentStatus.Paid;
            order.PaidAt = DateTime.UtcNow;
            order.TransactionReference = $"SANDBOX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            try
            {
                // Tự động cấp mã vé
                await _ticketService.IssueTicketsForOrderAsync(order.OrderId);
            }
            catch
            {
                order.PaymentStatus = previousStatus;
                order.PaidAt = null;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                throw;
            }

            var ticketsList = await _context.Tickets
                .Where(t => t.OrderId == order.OrderId)
                .ToListAsync();

            var dto = MapToDto(order, order.TicketType, ticketsList);
            dto.EmailSent = null;
            dto.EmailStatusMessage = null;

            return dto;
        }
        finally
        {
            _webhookLock.Release();
        }
    }

    public async Task<OrderDto> ResendTicketEmailAsync(string orderCode, string? recipientEmail = null)
    {
        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Mã đơn hàng không hợp lệ.");

        var normalizedCode = orderCode.Trim().ToUpper();
        var order = await _context.TicketOrders
            .Include(o => o.TicketType)
            .Include(o => o.Tickets)
            .FirstOrDefaultAsync(o => o.OrderCode.ToUpper() == normalizedCode || o.PaymentDescription.ToUpper() == normalizedCode);

        if (order == null)
            throw new ArgumentException($"Không tìm thấy đơn hàng #{orderCode}.");

        if (order.PaymentStatus != PaymentStatus.Paid)
            throw new InvalidOperationException($"Đơn hàng #{orderCode} chưa được thanh toán (Trạng thái: {order.PaymentStatus}). Không thể gửi vé.");

        var ticketsList = order.Tickets?.ToList() ?? new List<Ticket>();
        if (!ticketsList.Any())
        {
            await _ticketService.IssueTicketsForOrderAsync(order.OrderId);
            ticketsList = await _context.Tickets.Where(t => t.OrderId == order.OrderId).ToListAsync();
        }

        var targetEmail = !string.IsNullOrWhiteSpace(recipientEmail) ? recipientEmail.Trim().ToLower() : order.CustomerEmail;

        EmailSendResult emailResult;
        if (_emailService == null)
        {
            emailResult = new EmailSendResult
            {
                Success = false,
                ErrorCode = "SERVICE_UNAVAILABLE",
                Message = "Dịch vụ gửi email chưa được cài đặt trên hệ thống máy chủ."
            };
        }
        else
        {
            emailResult = await _emailService.SendTicketConfirmationEmailAsync(order, ticketsList, targetEmail);
        }

        var dto = MapToDto(order, order.TicketType, ticketsList);
        dto.EmailSent = emailResult.Success;
        dto.EmailStatusMessage = emailResult.Message;
        return dto;
    }

    private static OrderDto MapToDto(TicketOrder o, TicketType tt, List<Ticket> tickets)
    {
        return new OrderDto
        {
            OrderId = o.OrderId,
            OrderCode = o.OrderCode,
            CustomerName = o.CustomerName,
            CustomerEmail = o.CustomerEmail,
            CustomerPhone = o.CustomerPhone,
            TicketTypeId = o.TicketTypeId,
            TicketTypeName = tt?.Name ?? "Vé tham quan tiêu chuẩn",
            Quantity = o.Quantity,
            UnitPrice = o.UnitPrice,
            TotalAmount = o.TotalAmount,
            PaymentStatus = o.PaymentStatus,
            PaymentMethod = o.PaymentMethod,
            PaymentDescription = o.PaymentDescription,
            QrCodeUrl = o.QrCodeUrl,
            BankName = BankNameDisplay,
            AccountNumber = AccountNumber,
            AccountName = AccountName,
            TransactionReference = o.TransactionReference,
            PaidAt = o.PaidAt,
            CreatedAt = o.CreatedAt,
            ExpiresAt = o.ExpiresAt,
            IssuedTickets = tickets.Select(t => new IssuedTicketDto
            {
                TicketId = t.TicketId,
                TicketCode = t.TicketCode,
                TicketTypeName = tt?.Name ?? "Vé tham quan tiêu chuẩn",
                ValidFrom = t.ValidFrom,
                ValidUntil = t.ValidUntil,
                Status = t.Status
            }).ToList()
        };
    }
}
