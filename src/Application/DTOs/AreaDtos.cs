using System.ComponentModel.DataAnnotations;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.DTOs;

/// <summary>
/// DTO trả về thông tin khu vực
/// </summary>
public class AreaResponseDto
{
    public int AreaId { get; set; }
    public string Id => $"zone-{Code.ToLowerInvariant()}"; // Tương thích frontend: "zone-a"
    public string Code { get; set; } = string.Empty;       // Mã phân khu: "A", "B", ...
    public string Name { get; set; } = string.Empty;
    public string NameVi => Name;                           // Alias tiếng Việt
    public string? Description { get; set; }
    public string? DescriptionVi => Description;            // Alias tiếng Việt
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal RadiusMeters { get; set; }
    public string? MapImageUrl { get; set; }
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public string Status { get; set; } = "Active";
    public int EnclosureCount { get; set; }
    public int AnimalCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<EnclosureResponse> Enclosures { get; set; } = new();
}

/// <summary>
/// DTO tạo mới khu vực
/// </summary>
public class CreateAreaDto
{
    [MaxLength(20, ErrorMessage = "Mã phân khu tối đa 20 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên khu vực không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên khu vực tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(-90.0, 90.0, ErrorMessage = "Vĩ độ (Latitude) phải nằm trong khoảng [-90, 90]")]
    public decimal Latitude { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "Kinh độ (Longitude) phải nằm trong khoảng [-180, 180]")]
    public decimal Longitude { get; set; }

    [Range(0.01, 10000.0, ErrorMessage = "Bán kính (RadiusMeters) phải lớn hơn 0")]
    public decimal RadiusMeters { get; set; }

    public string? MapImageUrl { get; set; }
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public AreaStatus Status { get; set; } = AreaStatus.Active;
}

/// <summary>
/// DTO cập nhật khu vực
/// </summary>
public class UpdateAreaDto
{
    [MaxLength(20, ErrorMessage = "Mã phân khu tối đa 20 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên khu vực không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên khu vực tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(-90.0, 90.0, ErrorMessage = "Vĩ độ (Latitude) phải nằm trong khoảng [-90, 90]")]
    public decimal Latitude { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "Kinh độ (Longitude) phải nằm trong khoảng [-180, 180]")]
    public decimal Longitude { get; set; }

    [Range(0.01, 10000.0, ErrorMessage = "Bán kính (RadiusMeters) phải lớn hơn 0")]
    public decimal RadiusMeters { get; set; }

    public string? MapImageUrl { get; set; }
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public AreaStatus Status { get; set; } = AreaStatus.Active;
}

/// <summary>
/// DTO kết quả tính toán điều hướng giữa vị trí hiện tại và khu vực
/// </summary>
public class AreaNavigationDto
{
    public int TargetAreaId { get; set; }
    public string TargetAreaName { get; set; } = string.Empty;
    public decimal TargetLatitude { get; set; }
    public decimal TargetLongitude { get; set; }
    public decimal UserLatitude { get; set; }
    public decimal UserLongitude { get; set; }
    public double DistanceMeters { get; set; }
    public double BearingDegrees { get; set; }
    public string DirectionCompass { get; set; } = string.Empty;
    public bool IsInsideArea { get; set; }
}
