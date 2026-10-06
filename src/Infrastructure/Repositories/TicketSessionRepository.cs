using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Repositories;

public class TicketSessionRepository : ITicketSessionRepository
{
    private readonly ZooGuideDbContext _context;

    public TicketSessionRepository(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<TicketSession?> GetByIdWithDetailsAsync(Guid sessionId)
    {
        return await _context.TicketSessions
            .Include(ts => ts.Ticket)
                .ThenInclude(t => t.TicketType)
            .Include(ts => ts.User)
            .FirstOrDefaultAsync(ts => ts.SessionId == sessionId);
    }

    public async Task<TicketSession> AddAsync(TicketSession session)
    {
        _context.TicketSessions.Add(session);
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task UpdateAsync(TicketSession session)
    {
        _context.TicketSessions.Update(session);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TicketSession>> GetAllWithDetailsAsync()
    {
        return await _context.TicketSessions
            .Include(ts => ts.Ticket)
                .ThenInclude(t => t.TicketType)
            .Include(ts => ts.User)
            .OrderByDescending(ts => ts.StartedAt)
            .AsNoTracking()
            .ToListAsync();
    }
}
