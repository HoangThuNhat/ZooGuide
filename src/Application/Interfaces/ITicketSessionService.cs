using ZooGuide.Application.DTOs;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface nghiệp vụ quản lý vé và phiên truy cập (Ticket Sessions)
/// </summary>
public interface ITicketSessionService
{
    Task<(bool Success, string Message, TicketSessionDto? Session, int StatusCode, string? ErrorCode)> ValidateTicketAsync(ValidateTicketRequestDto request);
    Task<TicketSession?> GetValidSessionAsync(Guid sessionId);
    Task<IEnumerable<TicketSessionDto>> GetAllSessionsAsync();
    Task<bool> RevokeSessionAsync(Guid sessionId);
}
