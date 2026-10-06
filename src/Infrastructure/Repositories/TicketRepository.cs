using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly ZooGuideDbContext _context;

    public TicketRepository(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<Ticket?> GetByCodeWithDetailsAsync(string ticketCode)
    {
        var normalized = ticketCode.Trim().ToUpper();
        return await _context.Tickets
            .Include(t => t.TicketType)
            .Include(t => t.TicketSessions)
            .FirstOrDefaultAsync(t => t.TicketCode.ToUpper() == normalized);
    }

    public async Task<Ticket?> GetByIdWithDetailsAsync(int ticketId)
    {
        return await _context.Tickets
            .Include(t => t.TicketType)
            .Include(t => t.TicketSessions)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId);
    }

    public async Task UpdateAsync(Ticket ticket)
    {
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync();
    }
}
