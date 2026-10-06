using ZooGuide.Application.DTOs.Ticket;

namespace ZooGuide.Application.Interfaces;

public interface ITicketService
{
    Task<IEnumerable<TicketDto>> GetAllAsync();
    Task<TicketDto?> GetByIdAsync(int id);
    Task<TicketDto> CreateAsync(TicketCreateRequest request);
    Task<TicketDto?> UpdateAsync(int id, TicketUpdateRequest request);
    Task<bool> DeleteAsync(int id);
    Task<ValidateTicketResponse> ValidateAsync(ValidateTicketRequest request);
}
