namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng ENCLOSURES: Đại diện cho một chuồng hoặc khu nuôi cụ thể; thuộc về một Area.
/// Cấu trúc phân cấp: Sở thú -> Area (Khu vực) -> Enclosure (Chuồng) -> Animal (Động vật).
/// </summary>
public class Enclosure
{
    public int EnclosureId { get; set; }
    public int AreaId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Area Area { get; set; } = null!;
    public virtual ICollection<Animal> Animals { get; set; } = new List<Animal>();
}
