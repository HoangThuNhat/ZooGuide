namespace ZooGuide.Application.DTOs;

public class AuditLogEntryDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Action { get; set; } = string.Empty; // CREATE, UPDATE, DELETE, REVOKE, VALIDATE, PUBLISH
    public string TargetEntity { get; set; } = string.Empty; // Animal, Area, Species, Ticket, Session, Narration
    public string TargetId { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = "Admin";
    public string Details { get; set; } = string.Empty;
    public bool Success { get; set; } = true;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
