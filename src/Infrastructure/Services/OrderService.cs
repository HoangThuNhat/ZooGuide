using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs.Order;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly ZooGuideDbContext _context;
    private readonly ITicketService _ticketService;

    // Cấu hình ngân hàng VietQR mặc định (hỗ trợ ghi đè qua biến môi trường)
    private static string BankId => Environment.GetEnvironmentVariable("VIETQR_BANK_ID") ?? "MB";
    private static string BankNameDisplay => Environment.GetEnvironmentVariable("VIETQR_BANK_NAME") ?? "MBBank (Ngân hàng TMCP Quân Đội)";
    private static string AccountNumber => Environment.GetEnvironmentVariable("VIETQR_ACCOUNT_NUMBER") ?? "0988888888";
    private static string AccountName => Environment.GetEnvironmentVariable("VIETQR_ACCOUNT_NAME") ?? "CONG TY TNHH MTV THAO CAM VIEN SAI GON";
    private static string WebhookSecret => Environment.GetEnvironmentVariable("PAYMENT_WEBHOOK_SECRET") ?? "ZooGuideSecKey2026";

    public OrderService(ZooGuideDbContext context, ITicketService ticketService)
    {
        _context = context;
        _ticketService = ticketService;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));

        var ticketType = await _context.TicketTypes.FindAsync(request.TicketTypeId);
        if (ticketType == null || !ticketType.IsActive)
        {
            throw new ArgumentException("Hạng vé tham quan không tồn tại hoặc đã ngừng cung cấp.");
        }

        if (request.Quantity <= 0)
        {
            throw new ArgumentException("Số lượng vé phải lớn hơn 0.");
        }

        // Giá vé lấy tuyệt đối từ cơ sở dữ liệu phía máy chủ (Nguyên tắc bảo mật 6.2)
        var unitPrice = ticketType.Price;
        var totalAmount = unitPrice * request.Quantity;

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
            Quantity = request.Quantity,
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

    public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync(string? search = null, PaymentStatus? status = null)
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

        var list = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return list.Select(o => MapToDto(o, o.TicketType, o.Tickets?.ToList() ?? new List<Ticket>()));
    }

    public async Task<bool> ProcessPaymentWebhookAsync(PaymentWebhookPayload payload, string? signature = null)
    {
        if (payload == null) return false;

        // 1. Kiểm tra Webhook Secret/Signature nếu có truyền
        if (!string.IsNullOrEmpty(signature) && signature != WebhookSecret)
        {
            Console.WriteLine("Warning: Invalid payment webhook secret signature.");
            return false;
        }

        // 2. Tìm mã đơn hàng từ nội dung chuyển khoản
        var content = (payload.Content ?? payload.Description ?? "").ToUpper();
        if (string.IsNullOrWhiteSpace(content)) return false;

        var order = await _context.TicketOrders
            .Include(o => o.TicketType)
            .Include(o => o.Tickets)
            .FirstOrDefaultAsync(o => content.Contains(o.PaymentDescription.ToUpper()) || content.Contains(o.OrderCode.ToUpper()));

        if (order == null)
        {
            Console.WriteLine($"Webhook note: No matching pending order for content: {content}");
            return false;
        }

        // 3. Idempotency: Nếu đơn hàng đã hoàn tất, xác nhận 200 OK ngay để tránh webhook gửi lại sinh thừa vé
        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            return true;
        }

        // 4. Đối soát số tiền giao dịch: Số tiền thanh toán phải lớn hơn hoặc bằng tổng tiền đơn
        if (payload.TransferAmount < order.TotalAmount)
        {
            Console.WriteLine($"Webhook error: Transfer amount {payload.TransferAmount} is less than order amount {order.TotalAmount}.");
            order.PaymentStatus = PaymentStatus.Failed;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return false;
        }

        // 5. Cập nhật trạng thái đơn hàng thành Paid
        order.PaymentStatus = PaymentStatus.Paid;
        order.PaidAt = DateTime.UtcNow;
        order.TransactionReference = payload.ReferenceCode ?? payload.Code ?? $"TXN-{Guid.NewGuid():N}";
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // 6. Tự động phát hành vé điện tử cho đơn hàng
        await _ticketService.IssueTicketsForOrderAsync(order.OrderId);

        return true;
    }

    public async Task<OrderDto> SimulateSandboxPaymentAsync(SimulatePaymentRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.OrderCode))
        {
            throw new ArgumentException("Mã đơn hàng không hợp lệ.");
        }

        var order = await _context.TicketOrders
            .Include(o => o.TicketType)
            .Include(o => o.Tickets)
            .FirstOrDefaultAsync(o => o.OrderCode == request.OrderCode.Trim().ToUpper());

        if (order == null)
        {
            throw new ArgumentException($"Không tìm thấy đơn hàng {request.OrderCode}.");
        }

        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            return MapToDto(order, order.TicketType, order.Tickets?.ToList() ?? new List<Ticket>());
        }

        var amount = request.Amount ?? order.TotalAmount;
        if (amount < order.TotalAmount)
        {
            throw new InvalidOperationException($"Số tiền giả lập ({amount:N0} đ) không đủ so với giá trị đơn hàng ({order.TotalAmount:N0} đ).");
        }

        order.PaymentStatus = PaymentStatus.Paid;
        order.PaidAt = DateTime.UtcNow;
        order.TransactionReference = $"SANDBOX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Tự động cấp mã vé
        var issuedTickets = await _ticketService.IssueTicketsForOrderAsync(order.OrderId);

        var ticketsList = await _context.Tickets
            .Where(t => t.OrderId == order.OrderId)
            .ToListAsync();

        return MapToDto(order, order.TicketType, ticketsList);
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
