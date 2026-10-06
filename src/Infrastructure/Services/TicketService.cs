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

    public TicketService(ZooGuideDbContext context, ITicketSessionService ticketSessionService)
    {
        _context = context;
        _ticketSessionService = ticketSessionService;
    }

    public async Task<IEnumerable<TicketDto>> GetAllAsync()
    {
        return await _context.Tickets
            .Include(t => t.TicketType)
            .Select(t => new TicketDto
            {
                TicketId = t.TicketId,
                TicketCode = t.TicketCode,
                TicketTypeId = t.TicketTypeId,
                TicketTypeName = t.TicketType.Name,
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
            .FirstOrDefaultAsync(x => x.TicketId == id);
            
        if (t == null) return null;

        return new TicketDto
        {
            TicketId = t.TicketId,
            TicketCode = t.TicketCode,
            TicketTypeId = t.TicketTypeId,
            TicketTypeName = t.TicketType.Name,
            IssuedAt = t.IssuedAt,
            ValidFrom = t.ValidFrom,
            ValidUntil = t.ValidUntil,
            Status = t.Status,
            UsedAt = t.UsedAt,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        };
    }

    public async Task<TicketDto> CreateAsync(TicketCreateRequest request)
    {
        var ticketType = await _context.TicketTypes.FindAsync(request.TicketTypeId);
        if (ticketType == null)
            throw new ArgumentException("TicketType not found");

        if (string.IsNullOrWhiteSpace(request.TicketCode))
            request.TicketCode = "ZOO-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 5).ToUpper();

        if (request.ValidUntil <= request.ValidFrom)
            throw new ArgumentException("ValidUntil must be after ValidFrom");

        var exists = await _context.Tickets.AnyAsync(t => t.TicketCode == request.TicketCode);
        if (exists)
            throw new InvalidOperationException("TicketCode already exists");

        var ticket = new Ticket
        {
            TicketCode = request.TicketCode,
            TicketTypeId = request.TicketTypeId,
            ValidFrom = request.ValidFrom,
            ValidUntil = request.ValidUntil,
            Status = request.Status,
            IssuedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(ticket.TicketId) ?? throw new Exception("Failed to retrieve created ticket");
    }

    public async Task<TicketDto?> UpdateAsync(int id, TicketUpdateRequest request)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return null;

        // Allowed by Admin UI to toggle status

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

    public async Task<bool> DeleteAsync(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.TicketSessions)
            .Include(t => t.VisitHistories)
            .FirstOrDefaultAsync(t => t.TicketId == id);
            
        if (ticket == null) return false;

        if (ticket.TicketSessions.Any() || ticket.VisitHistories.Any())
        {
            throw new InvalidOperationException("Cannot delete ticket because it is already used in sessions or visit history.");
        }

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ValidateTicketResponse> ValidateAsync(ValidateTicketRequest request)
    {
        var ticket = await _context.Tickets
            .Include(t => t.TicketType)
            .FirstOrDefaultAsync(t => t.TicketCode == request.TicketCode);

        if (ticket == null)
        {
            return new ValidateTicketResponse { Valid = false, Message = "Ticket not found" };
        }

        if (ticket.Status != TicketStatus.Valid)
        {
            return new ValidateTicketResponse { Valid = false, Message = $"Ticket is {ticket.Status}" };
        }

        var now = DateTime.UtcNow;
        if (now < ticket.ValidFrom)
        {
            return new ValidateTicketResponse { Valid = false, Message = "Ticket is not yet valid" };
        }
        if (now > ticket.ValidUntil)
        {
            ticket.Status = TicketStatus.Expired;
            ticket.UpdatedAt = now;
            await _context.SaveChangesAsync();
            return new ValidateTicketResponse { Valid = false, Message = "Ticket is expired" };
        }

        // Ticket is valid. Trigger Session creation.
        var session = await _ticketSessionService.CreateSessionAsync(ticket.TicketId);

        // Update ticket to used if needed
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
            Message = "Ticket validated successfully",
            SessionId = session.SessionId,
            ValidUntil = ticket.ValidUntil
        };
    }
}
