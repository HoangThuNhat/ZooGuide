using System.ComponentModel.DataAnnotations;

namespace ZooGuide.Application.DTOs;

/// <summary>
/// DTO trả về thông tin chuồng trại (Enclosure)
/// </summary>
public class EnclosureResponse
{
    public int EnclosureId { get; set; }
    public int Id => EnclosureId;
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public string? AreaCode { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? OriginalName { get; set; }
    public string? Description { get; set; }
    public string LanguageCode { get; set; } = "vi";
    public bool HasTranslation { get; set; } = true;
    public string? ReferenceSource { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal RadiusMeters { get; set; } = 30m;
    public int AnimalCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AnimalResponseDto> Animals { get; set; } = new();
}

/// <summary>
/// DTO chi tiết chuồng trại kèm thông tin phân khu và danh sách cá thể động vật bên trong
/// </summary>
public class EnclosureDetailResponse : EnclosureResponse
{
    public AreaResponseDto? Area { get; set; }
}

/// <summary>
/// DTO yêu cầu tạo mới chuồng trại (Enclosure)
/// </summary>
public class CreateEnclosureRequest
{
    [Required(ErrorMessage = "AreaId không được để trống")]
    [Range(1, int.MaxValue, ErrorMessage = "AreaId phải lớn hơn 0")]
    public int AreaId { get; set; }

    [MaxLength(50, ErrorMessage = "Mã chuồng tối đa 50 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên chuồng không được để trống")]
    [MaxLength(200, ErrorMessage = "Tên chuồng tối đa 200 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "Đường dẫn hình ảnh tối đa 500 ký tự")]
    public string? ImageUrl { get; set; }

    [MaxLength(50, ErrorMessage = "Trạng thái tối đa 50 ký tự")]
    public string Status { get; set; } = "Active";

    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

/// <summary>
/// DTO yêu cầu cập nhật chuồng trại (Enclosure)
/// </summary>
public class UpdateEnclosureRequest
{
    [Required(ErrorMessage = "AreaId không được để trống")]
    [Range(1, int.MaxValue, ErrorMessage = "AreaId phải lớn hơn 0")]
    public int AreaId { get; set; }

    [MaxLength(50, ErrorMessage = "Mã chuồng tối đa 50 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên chuồng không được để trống")]
    [MaxLength(200, ErrorMessage = "Tên chuồng tối đa 200 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "Đường dẫn hình ảnh tối đa 500 ký tự")]
    public string? ImageUrl { get; set; }

    [MaxLength(50, ErrorMessage = "Trạng thái tối đa 50 ký tự")]
    public string Status { get; set; } = "Active";

    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

/// <summary>
/// DTO bộ lọc tìm kiếm chuồng (query string cho GET /api/enclosures)
/// </summary>
public class EnclosureFilterRequest
{
    public int? AreaId { get; set; }
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? Lang { get; set; }
}

/// <summary>
/// DTO yêu cầu chuyển cá thể động vật sang chuồng khác (hoặc gỡ khỏi chuồng khi TargetEnclosureId rỗng)
/// </summary>
public class MoveAnimalRequest
{
    [Required(ErrorMessage = "Mã cá thể động vật (AnimalId) không được để trống")]
    public int AnimalId { get; set; }

    public int? TargetEnclosureId { get; set; }
}
