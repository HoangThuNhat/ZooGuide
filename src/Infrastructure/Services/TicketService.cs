using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class TicketService : ITicketService
{
    private readonly ZooGuideDbContext _context;
    private readonly ITicketSessionService _ticketSessionService;
    private readonly IEmailService? _emailService;

    public TicketService(
        ZooGuideDbContext context, 
        ITicketSessionService ticketSessionService,
        IEmailService? emailService = null)
    {
        _context = context;
        _ticketSessionService = ticketSessionService;
        _emailService = emailService;
    }

    public async Task<IEnumerable<TicketDto>> GetAllAsync(string? search = null, int? ticketTypeId = null, TicketStatus? status = null)
    {
        var query = _context.Tickets
            .Include(t => t.TicketType)
            .Include(t => t.Order)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t => 
                t.TicketCode.ToLower().Contains(term) || 
                (t.TicketType != null && t.TicketType.Name.ToLower().Contains(term)) ||
                (t.Order != null && (
                    t.Order.CustomerName.ToLower().Contains(term) || 
                    t.Order.OrderCode.ToLower().Contains(term) ||
                    t.Order.CustomerEmail.ToLower().Contains(term) ||
                    t.Order.CustomerPhone.ToLower().Contains(term)
                ))
            );
        }

        if (ticketTypeId.HasValue && ticketTypeId.Value > 0)
        {
            query = query.Where(t => t.TicketTypeId == ticketTypeId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketDto
            {
                TicketId = t.TicketId,
                TicketCode = t.TicketCode,
                TicketTypeId = t.TicketTypeId,
                TicketTypeName = t.TicketType.Name,
                OrderId = t.OrderId,
                OrderCode = t.Order != null ? t.Order.OrderCode : null,
                CustomerName = t.Order != null ? t.Order.CustomerName : null,
                CustomerEmail = t.Order != null ? t.Order.CustomerEmail : null,
                CustomerPhone = t.Order != null ? t.Order.CustomerPhone : null,
                IssuedAt = t.IssuedAt,
                ValidFrom = t.ValidFrom,
                ValidUntil = t.ValidUntil,
                Status = t.Status,
                UsedAt = t.UsedAt,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<TicketDto?> GetByIdAsync(int id)
    {
        var t = await _context.Tickets
            .Include(x => x.TicketType)
            .Include(x => x.Order)
            .FirstOrDefaultAsync(x => x.TicketId == id);
            
        if (t == null) return null;

        return new TicketDto
        {
            TicketId = t.TicketId,
            TicketCode = t.TicketCode,
            TicketTypeId = t.TicketTypeId,
            TicketTypeName = t.TicketType.Name,
            OrderId = t.OrderId,
            OrderCode = t.Order?.OrderCode,
            CustomerName = t.Order?.CustomerName,
            CustomerEmail = t.Order?.CustomerEmail,
            CustomerPhone = t.Order?.CustomerPhone,
            IssuedAt = t.IssuedAt,
            ValidFrom = t.ValidFrom,
            ValidUntil = t.ValidUntil,
            Status = t.Status,
            UsedAt = t.UsedAt,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        };
    }

    /// <summary>
    /// Phát hành vé trực tiếp / vé sự kiện do Ban Quản trị thực hiện tại quầy.
    /// Khởi tạo kèm đơn hàng quản trị (PaymentMethod = 'AdminDirect', PaymentStatus = Paid) 
    /// nhằm phân biệt rõ với khách mua vé trực tuyến VietQR mà vẫn bảo đảm toàn vẹn dữ liệu.
    /// </summary>
    public async Task<TicketDto> CreateAsync(TicketCreateRequest request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        var ticketType = await _context.TicketTypes.FindAsync(request.TicketTypeId);
        if (ticketType == null)
            throw new ArgumentException($"Loại vé với ID {request.TicketTypeId} không tồn tại.");

        var now = DateTime.UtcNow;
        var validFrom = request.ValidFrom ?? now;
        var durationMinutes = ticketType.DurationMinutes > 0 ? ticketType.DurationMinutes : 1440;
        var validUntil = request.ValidUntil ?? validFrom.AddMinutes(durationMinutes);
        if (validUntil <= validFrom)
        {
            validUntil = validFrom.AddMinutes(durationMinutes);
        }

        // Sinh hoặc kiểm tra mã vé
        string ticketCode;
        if (!string.IsNullOrWhiteSpace(request.TicketCode))
        {
            ticketCode = request.TicketCode.Trim().ToUpper();
            var exists = await _context.Tickets.AnyAsync(t => t.TicketCode == ticketCode);
            if (exists)
                throw new InvalidOperationException($"Mã vé '{ticketCode}' đã tồn tại trên hệ thống.");
        }
        else
        {
            bool exists;
            do
            {
                var randomBytes = new byte[4];
                RandomNumberGenerator.Fill(randomBytes);
                var randomHex = Convert.ToHexString(randomBytes).ToUpper();
                ticketCode = $"ZG-{DateTime.UtcNow:yyyyMMdd}-{randomHex}";
                exists = await _context.Tickets.AnyAsync(t => t.TicketCode == ticketCode);
            } while (exists);
        }

        // Khởi tạo TicketOrder cho giao dịch phát hành trực tiếp của Admin
        var orderCode = $"ZG-ADM-{now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
        var order = new TicketOrder
        {
            OrderCode = orderCode,
            CustomerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Khách mua tại quầy" : request.CustomerName.Trim(),
            CustomerEmail = request.CustomerEmail?.Trim() ?? string.Empty,
            CustomerPhone = request.CustomerPhone?.Trim() ?? string.Empty,
            TicketTypeId = ticketType.TicketTypeId,
            Quantity = 1,
            UnitPrice = ticketType.Price,
            TotalAmount = ticketType.Price,
            PaymentStatus = PaymentStatus.Paid,
            PaymentMethod = "AdminDirect",
            PaymentDescription = string.IsNullOrWhiteSpace(request.Note) ? "Phát hành vé trực tiếp bởi Quản trị viên" : request.Note.Trim(),
            TransactionReference = $"ADM-{Guid.NewGuid():N}"[..18].ToUpper(),
            PaidAt = now,
            CreatedAt = now,
            ExpiresAt = validUntil.AddDays(7)
        };
        _context.TicketOrders.Add(order);
        await _context.SaveChangesAsync();

        // Tạo vé tham quan
        var ticket = new Ticket
        {
            TicketCode = ticketCode,
            TicketTypeId = ticketType.TicketTypeId,
            OrderId = order.OrderId,
            IssuedAt = now,
            ValidFrom = validFrom,
            ValidUntil = validUntil,
            Status = request.Status,
            CreatedAt = now
        };
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Gửi email vé điện tử nếu có email khách hàng hợp lệ
        if (_emailService != null && !string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            try
            {
                await _emailService.SendTicketConfirmationEmailAsync(order, new List<Ticket> { ticket });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"TicketService: Gửi email vé thủ công không thành công (vé vẫn hợp lệ): {ex.Message}");
            }
        }

        return new TicketDto
        {
            TicketId = ticket.TicketId,
            TicketCode = ticket.TicketCode,
            TicketTypeId = ticket.TicketTypeId,
            TicketTypeName = ticketType.Name,
            OrderId = order.OrderId,
            OrderCode = order.OrderCode,
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail,
            CustomerPhone = order.CustomerPhone,
            IssuedAt = ticket.IssuedAt,
            ValidFrom = ticket.ValidFrom,
            ValidUntil = ticket.ValidUntil,
            Status = ticket.Status,
            UsedAt = ticket.UsedAt,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt
        };
    }

    public async Task<TicketDto?> UpdateAsync(int id, TicketUpdateRequest request)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return null;

        if (request.ValidUntil <= request.ValidFrom)
            throw new ArgumentException("ValidUntil must be after ValidFrom");

        var ticketType = await _context.TicketTypes.FindAsync(request.TicketTypeId);
        if (ticketType == null)
            throw new ArgumentException("TicketType not found");

        if (ticket.TicketCode != request.TicketCode)
        {
            var exists = await _context.Tickets.AnyAsync(t => t.TicketCode == request.TicketCode);
            if (exists)
                throw new InvalidOperationException("TicketCode already exists");
        }

        ticket.TicketCode = request.TicketCode;
        ticket.TicketTypeId = request.TicketTypeId;
        ticket.ValidFrom = request.ValidFrom;
        ticket.ValidUntil = request.ValidUntil;
        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(ticket.TicketId);
    }

    public async Task<TicketDto?> UpdateStatusAsync(int id, TicketStatus status)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return null;

        // Quản trị viên cập nhật trạng thái quản lý / sử dụng vé
        ticket.Status = status;
        if (status == TicketStatus.Used && !ticket.UsedAt.HasValue)
        {
            ticket.UsedAt = DateTime.UtcNow;
        }
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(ticket.TicketId);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Order)
            .Include(t => t.TicketSessions)
            .Include(t => t.VisitHistories)
            .FirstOrDefaultAsync(t => t.TicketId == id);
            
        if (ticket == null) return false;

        // 1. Kiểm tra vé đã sử dụng hoặc check-in
        if (ticket.Status == TicketStatus.Used || ticket.UsedAt.HasValue)
        {
            throw new InvalidOperationException("Không thể xóa vé đã check-in hoặc đã qua sử dụng.");
        }

        // 2. Kiểm tra vé đã thanh toán và phát hành chính thức gắn với giao dịch cần bảo toàn
        if (ticket.OrderId.HasValue && ticket.Order != null && ticket.Order.PaymentStatus == PaymentStatus.Paid)
        {
            throw new InvalidOperationException("Không thể xóa cứng vé đã thanh toán và phát hành chính thức trong hệ thống giao dịch. Vui lòng sử dụng tính năng Hủy vé để bảo toàn dữ liệu tài chính.");
        }

        // 3. Kiểm tra ràng buộc dữ liệu phiên tham quan hoặc lịch sử
        if (ticket.TicketSessions.Any() || ticket.VisitHistories.Any())
        {
            throw new InvalidOperationException("Không thể xóa vé vì vé đã có lịch sử tham quan hoặc phiên thiết bị.");
        }

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ValidateTicketResponse> ValidateAsync(ValidateTicketRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.TicketCode))
        {
            return new ValidateTicketResponse
            {
                Valid = false,
                ErrorCode = "INVALID_INPUT",
                Message = "Vui lòng nhập mã vé hợp lệ."
            };
        }

        var normalizedCode = request.TicketCode.Trim().ToUpper();
        var ticket = await _context.Tickets
            .Include(t => t.TicketType)
            .FirstOrDefaultAsync(t => t.TicketCode.ToUpper() == normalizedCode);

        // 1. Kiểm tra tồn tại
        if (ticket == null)
        {
            return new ValidateTicketResponse 
            { 
                Valid = false, 
                ErrorCode = "TICKET_NOT_FOUND",
                Message = "Không tìm thấy vé trong hệ thống! Vui lòng kiểm tra lại mã vé hoặc liên hệ quầy vé ZooGuide." 
            };
        }

        var now = DateTime.UtcNow;

        // 2. Kiểm tra trạng thái bị hủy
        if (ticket.Status == TicketStatus.Cancelled)
        {
            return new ValidateTicketResponse 
            { 
                Valid = false, 
                ErrorCode = "TICKET_CANCELLED",
                Message = $"Vé {ticket.TicketCode} đã bị hủy trên hệ thống." 
            };
        }

        // 3. Kiểm tra trạng thái bị khóa
        if (ticket.Status == TicketStatus.Locked)
        {
            return new ValidateTicketResponse 
            { 
                Valid = false, 
                ErrorCode = "TICKET_LOCKED",
                Message = $"Vé {ticket.TicketCode} hiện đang bị tạm khóa. Vui lòng liên hệ ban quản lý ZooGuide." 
            };
        }

        // 4. Kiểm tra vé đã sử dụng
        if (ticket.Status == TicketStatus.Used)
        {
            return new ValidateTicketResponse 
            { 
                Valid = false, 
                ErrorCode = "TICKET_ALREADY_USED",
                Message = $"Vé {ticket.TicketCode} đã được kích hoạt sử dụng trước đó (lúc {ticket.UsedAt:yyyy-MM-dd HH:mm:ss})." 
            };
        }

        // 5. Kiểm tra thời gian hiệu lực
        if (now < ticket.ValidFrom)
        {
            return new ValidateTicketResponse 
            { 
                Valid = false, 
                ErrorCode = "TICKET_NOT_YET_VALID",
                Message = $"Vé {ticket.TicketCode} chưa đến thời gian có hiệu lực ({ticket.ValidFrom:yyyy-MM-dd})." 
            };
        }

        if (ticket.Status == TicketStatus.Expired || now > ticket.ValidUntil)
        {
            ticket.Status = TicketStatus.Expired;
            ticket.UpdatedAt = now;
            await _context.SaveChangesAsync();
            return new ValidateTicketResponse 
            { 
                Valid = false, 
                ErrorCode = "TICKET_EXPIRED",
                Message = $"Vé {ticket.TicketCode} đã hết hạn sử dụng vào ngày {ticket.ValidUntil:yyyy-MM-dd}." 
            };
        }

        // 6. Vé hợp lệ: Khởi tạo phiên tham quan (Ticket Session)
        var session = await _ticketSessionService.CreateSessionAsync(ticket.TicketId);

        // Đánh dấu vé đã sử dụng
        ticket.Status = TicketStatus.Used;
        ticket.UsedAt = now;
        ticket.UpdatedAt = now;
        await _context.SaveChangesAsync();

        return new ValidateTicketResponse
        {
            Valid = true,
            TicketId = ticket.TicketId,
            TicketCode = ticket.TicketCode,
            TicketTypeId = ticket.TicketTypeId,
            TicketTypeName = ticket.TicketType?.Name ?? "Vé tham quan tiêu chuẩn",
            Message = "Xác thực vé thành công! Phiên tham quan đã được mở khóa.",
            SessionId = session.SessionId,
            ValidUntil = ticket.ValidUntil,
            ExpiresAt = session.ExpiredAt
        };
    }

    /// <summary>
    /// Cấp mã vé tự động cho đơn hàng sau khi thanh toán thành công (Quy trình chuẩn 6.4)
    /// </summary>
    public async Task<List<TicketDto>> IssueTicketsForOrderAsync(int orderId)
    {
        var order = await _context.TicketOrders
            .Include(o => o.TicketType)
            .Include(o => o.Tickets)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
            throw new ArgumentException("Không tìm thấy đơn hàng cần phát hành vé.");

        if (order.PaymentStatus != PaymentStatus.Paid)
            throw new InvalidOperationException("Chỉ được cấp mã vé khi đơn hàng đã thanh toán thành công.");

        // Idempotency: Nếu đơn hàng này đã từng cấp vé rồi, trả về danh sách vé hiện hữu, không cấp thừa
        if (order.Tickets != null && order.Tickets.Count >= order.Quantity)
        {
            return order.Tickets.Select(t => new TicketDto
            {
                TicketId = t.TicketId,
                TicketCode = t.TicketCode,
                TicketTypeId = t.TicketTypeId,
                TicketTypeName = order.TicketType.Name,
                IssuedAt = t.IssuedAt,
                ValidFrom = t.ValidFrom,
                ValidUntil = t.ValidUntil,
                Status = t.Status,
                UsedAt = t.UsedAt,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            }).ToList();
        }

        var durationMinutes = order.TicketType.DurationMinutes > 0 ? order.TicketType.DurationMinutes : 480;
        var validFrom = DateTime.UtcNow;
        var validUntil = validFrom.AddMinutes(durationMinutes);
        var createdTickets = new List<Ticket>();

        int needToCreate = order.Quantity - (order.Tickets?.Count ?? 0);
        for (int i = 0; i < needToCreate; i++)
        {
            string ticketCode;
            bool exists;
            do
            {
                // Sinh mã vé an toàn ngẫu nhiên: ZG-yyyyMMdd-XXXXXXXX (crypto-secure)
                var randomBytes = new byte[4];
                RandomNumberGenerator.Fill(randomBytes);
                var randomHex = Convert.ToHexString(randomBytes).ToUpper();
                ticketCode = $"ZG-{DateTime.UtcNow:yyyyMMdd}-{randomHex}";
                exists = await _context.Tickets.AnyAsync(t => t.TicketCode == ticketCode);
            } while (exists);

            var ticket = new Ticket
            {
                TicketCode = ticketCode,
                TicketTypeId = order.TicketTypeId,
                OrderId = order.OrderId,
                IssuedAt = DateTime.UtcNow,
                ValidFrom = validFrom,
                ValidUntil = validUntil,
                Status = TicketStatus.Valid,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);
            createdTickets.Add(ticket);
        }

        await _context.SaveChangesAsync();

        return createdTickets.Select(t => new TicketDto
        {
            TicketId = t.TicketId,
            TicketCode = t.TicketCode,
            TicketTypeId = t.TicketTypeId,
            TicketTypeName = order.TicketType.Name,
            IssuedAt = t.IssuedAt,
            ValidFrom = t.ValidFrom,
            ValidUntil = t.ValidUntil,
            Status = t.Status,
            UsedAt = t.UsedAt,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        }).ToList();
    }
}
