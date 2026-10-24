using System;
using System.Collections.Generic;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng POINTS_OF_INTEREST: Điểm tham quan thực tế (Cổng, Di tích, Cây di sản, Hồ cảnh quan, Điểm dịch vụ...).
/// Lưu trữ tọa độ địa lý WGS84 chính xác, trạng thái kiểm định tọa độ và liên kết thuyết minh đa ngôn ngữ độc lập.
/// </summary>
public class PointOfInterest
{
    public int PoiId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Landmark";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsCoordinateVerified { get; set; } = false;
    public string? VerificationSource { get; set; }
    public string? ImageUrl { get; set; }
    public int? AreaId { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Area? Area { get; set; }
    public virtual User? Creator { get; set; }
    public virtual ICollection<PoiNarration> Narrations { get; set; } = new List<PoiNarration>();
}
