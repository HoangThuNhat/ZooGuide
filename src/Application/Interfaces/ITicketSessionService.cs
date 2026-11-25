using ZooGuide.Application.DTOs;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface nghiệp vụ quản lý vé và phiên truy cập (Ticket Sessions)
/// </summary>
public interface ITicketSessionService
{
    Task<TicketSession> CreateSessionAsync(int ticketId);
    Task<(bool Success, string Message, TicketSessionDto? Session, int StatusCode, string? ErrorCode)> ValidateTicketAsync(ValidateTicketRequestDto request);
    Task<TicketSession?> GetValidSessionAsync(Guid sessionId);
    Task<IEnumerable<TicketSessionDto>> GetAllSessionsAsync(string? status = null, string? search = null);
    Task<bool> EndSessionAsync(Guid sessionId);
    Task<bool> RevokeSessionAsync(Guid sessionId);
}
