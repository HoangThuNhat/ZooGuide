using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.DTOs.Ticket;

public class TicketDto
{
    public int TicketId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public int TicketTypeId { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public TicketStatus Status { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class TicketCreateRequest
{
    public int TicketTypeId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.Valid;
}

public class TicketUpdateRequest
{
    public int TicketTypeId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public TicketStatus Status { get; set; }
}

public class ValidateTicketRequest
{
    public string TicketCode { get; set; } = string.Empty;
}

public class ValidateTicketResponse
{
    public bool Valid { get; set; }
    public string? ErrorCode { get; set; }
    public int? TicketId { get; set; }
    public string? TicketCode { get; set; }
    public int? TicketTypeId { get; set; }
    public string? TicketTypeName { get; set; }
    public string? Message { get; set; }
    public Guid? SessionId { get; set; }
    public DateTime? ValidUntil { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
