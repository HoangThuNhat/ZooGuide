using ZooGuide.Application.DTOs.TicketType;

namespace ZooGuide.Application.Interfaces;

public interface ITicketTypeService
{
    Task<IEnumerable<TicketTypeDto>> GetAllAsync();
    Task<TicketTypeDto?> GetByIdAsync(int id);
    Task<TicketTypeDto> CreateAsync(TicketTypeCreateRequest request);
    Task<TicketTypeDto?> UpdateAsync(int id, TicketTypeUpdateRequest request);
    Task<bool> DeleteAsync(int id);
}
