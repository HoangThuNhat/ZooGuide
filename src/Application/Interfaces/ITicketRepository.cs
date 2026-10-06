using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface thao tác dữ liệu bảng TICKETS
/// </summary>
public interface ITicketRepository
{
    Task<Ticket?> GetByCodeWithDetailsAsync(string ticketCode);
    Task UpdateAsync(Ticket ticket);
}
