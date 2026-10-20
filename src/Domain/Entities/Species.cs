namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng SPECIES: Lưu trữ danh mục loài động vật sinh học (Sư tử, Hổ, Voi, Đại bàng...).
/// Tránh duplicate dữ liệu phân loại trong từng cá thể động vật.
/// Quan hệ: Species 1 - N Animals.
/// </summary>
public class Species
{
    public int SpeciesId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public string? Description { get; set; }
    public string? ConservationStatus { get; set; }
    public string? ImageUrl { get; set; }
    public string? Habitat { get; set; }
    public string? Diet { get; set; }
    public string? Lifespan { get; set; }
    public string? ReferenceSource { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Animal> Animals { get; set; } = new List<Animal>();
}
