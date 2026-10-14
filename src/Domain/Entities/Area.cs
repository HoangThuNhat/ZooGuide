using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng AREAS: Lưu trữ thông tin phân khu chuồng trại trong sở thú dùng cho Bản đồ số và định vị GPS.
/// NGUYÊN TẮC THIẾT KẾ:
/// - Area chỉ lưu tọa độ cố định của khu vực (Latitude, Longitude) và bán kính nhận diện (RadiusMeters).
/// - Không lưu GPS của visitor vào Area (tọa độ du khách được lưu trong TicketSession / LocationLogs).
/// - Thuật toán kiểm tra du khách có ở trong khu vực: khoảng cách (visitor_gps, area_gps) &lt;= RadiusMeters.
/// </summary>
public class Area
{
    public int AreaId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal RadiusMeters { get; set; }
    public string? MapImageUrl { get; set; }
    public string? Code { get; set; }
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public AreaStatus Status { get; set; } = AreaStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Enclosure> Enclosures { get; set; } = new List<Enclosure>();
    public virtual ICollection<Animal> Animals { get; set; } = new List<Animal>();
}
