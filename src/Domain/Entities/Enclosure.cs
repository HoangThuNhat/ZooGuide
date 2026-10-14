namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng ENCLOSURES: Lưu trữ thông tin chuồng trại thuộc các phân khu (Areas) trong sở thú.
/// Hệ thống phân cấp: Areas (Khu) -> Enclosures (Chuồng) -> Animals (Động vật).
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

    /// <summary>Tọa độ chuồng trên bản đồ sở thú (hệ tọa độ bản đồ 2D của frontend).</summary>
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Area? Area { get; set; }
    public virtual ICollection<Animal> Animals { get; set; } = new List<Animal>();
}
