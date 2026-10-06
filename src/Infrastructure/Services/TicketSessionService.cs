using ZooGuide.Application.Interfaces;

namespace ZooGuide.Infrastructure.Services;

public class TicketSessionService : Application.Services.TicketSessionService
{
    public TicketSessionService(
        ITicketRepository ticketRepository, 
        ITicketSessionRepository sessionRepository) 
        : base(ticketRepository, sessionRepository)
    {
    }
}
