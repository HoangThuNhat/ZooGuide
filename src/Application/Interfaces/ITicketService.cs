using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.Interfaces;

public interface ITicketService
{
    Task<IEnumerable<TicketDto>> GetAllAsync(string? search = null, int? ticketTypeId = null, TicketStatus? status = null);
    Task<TicketDto?> GetByIdAsync(int id);
    Task<TicketDto> CreateAsync(TicketCreateRequest request);
    Task<TicketDto?> UpdateAsync(int id, TicketUpdateRequest request);
    Task<TicketDto?> UpdateStatusAsync(int id, TicketStatus status);
    Task<bool> DeleteAsync(int id);
    Task<ValidateTicketResponse> ValidateAsync(ValidateTicketRequest request);
    Task<List<TicketDto>> IssueTicketsForOrderAsync(int orderId);
}
