using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class TicketSessionService : ITicketSessionService
{
    private readonly ZooGuideDbContext _context;

    public TicketSessionService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<TicketSession> CreateSessionAsync(int ticketId)
    {
        var ticket = await _context.Tickets.Include(t => t.TicketType).FirstOrDefaultAsync(t => t.TicketId == ticketId);
        if (ticket == null) throw new ArgumentException("Ticket not found");

        var duration = ticket.TicketType.DurationMinutes;
        var expiredAt = DateTime.UtcNow.AddMinutes(duration);

        var session = new TicketSession
        {
            TicketId = ticketId,
            StartedAt = DateTime.UtcNow,
            ExpiredAt = expiredAt,
            Status = SessionStatus.Active
        };

        _context.TicketSessions.Add(session);
        await _context.SaveChangesAsync();

        return session;
    }
}
