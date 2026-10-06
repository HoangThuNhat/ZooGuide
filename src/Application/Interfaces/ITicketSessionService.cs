using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

public interface ITicketSessionService
{
    Task<TicketSession> CreateSessionAsync(int ticketId);
}
