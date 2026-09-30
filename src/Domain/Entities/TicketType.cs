namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng TICKET_TYPES: Định nghĩa các loại vé tham quan (Vé người lớn, Vé trẻ em, Vé sinh viên, Vé đặc biệt).
/// </summary>
public class TicketType
{
    public int TicketTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
