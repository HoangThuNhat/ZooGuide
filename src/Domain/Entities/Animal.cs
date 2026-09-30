using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng ANIMALS: Lưu thông tin cá thể động vật trong sở thú.
/// QUAN HỆ & NGUYÊN TẮC:
/// - Species 1 - N Animals: Không duplicate thông tin loài trong bảng này.
/// - Areas 1 - N Animals: Động vật thuộc về một phân khu chuồng trại cụ thể.
/// - Không lưu trực tiếp nội dung thuyết minh trong Animal (tách riêng sang bảng Narrations).
/// </summary>
public class Animal
{
    public int AnimalId { get; set; }
    public int SpeciesId { get; set; }
    public int AreaId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AnimalGender Gender { get; set; } = AnimalGender.Unknown;
    public DateOnly? DateOfBirth { get; set; }
    public string? Origin { get; set; }
    public string? HealthStatus { get; set; }
    public string? ConservationNote { get; set; }
    public string? ImageUrl { get; set; }
    public AnimalStatus Status { get; set; } = AnimalStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Species Species { get; set; } = null!;
    public virtual Area Area { get; set; } = null!;
    public virtual ICollection<Narration> Narrations { get; set; } = new List<Narration>();
}
