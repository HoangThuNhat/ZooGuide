using System;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng POI_NARRATIONS: Thuyết minh đa ngôn ngữ riêng biệt cho từng Điểm tham quan (POI).
/// Độc lập hoàn toàn với thuyết minh động vật (NARRATIONS), bảo toàn tính toàn vẹn dữ liệu.
/// </summary>
public class PoiNarration
{
    public int PoiNarrationId { get; set; }
    public int PoiId { get; set; }
    public int LanguageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public NarrationStatus Status { get; set; } = NarrationStatus.Published;
    public string? ReferenceSource { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual PointOfInterest PointOfInterest { get; set; } = null!;
    public virtual Language Language { get; set; } = null!;
    public virtual User Creator { get; set; } = null!;
}
