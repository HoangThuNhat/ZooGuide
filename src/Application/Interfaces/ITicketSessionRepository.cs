using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface thao tác dữ liệu bảng TICKET_SESSIONS
/// </summary>
public interface ITicketSessionRepository
{
    Task<TicketSession?> GetByIdWithDetailsAsync(Guid sessionId);
    Task<TicketSession> AddAsync(TicketSession session);
    Task UpdateAsync(TicketSession session);
    Task<List<TicketSession>> GetAllWithDetailsAsync();
}
