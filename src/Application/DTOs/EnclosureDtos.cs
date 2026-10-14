using System.ComponentModel.DataAnnotations;

namespace ZooGuide.Application.DTOs;

/// <summary>
/// DTO trả về thông tin chuồng/khu nuôi
/// </summary>
public class EnclosureResponseDto
{
    public int EnclosureId { get; set; }
    public int Id => EnclosureId;
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public string? AreaCode { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
    public int AnimalCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AnimalResponseDto> Animals { get; set; } = new();
}

/// <summary>
/// DTO chi tiết chuồng kèm danh sách cá thể động vật bên trong
/// </summary>
public class EnclosureDetailDto : EnclosureResponseDto
{
    public AreaResponseDto? Area { get; set; }
}

/// <summary>
/// DTO tạo mới chuồng
/// </summary>
public class CreateEnclosureDto
{
    [Required(ErrorMessage = "Phân khu trực thuộc (AreaId) không được để trống")]
    public int AreaId { get; set; }

    [MaxLength(50, ErrorMessage = "Mã chuồng tối đa 50 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên chuồng không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên chuồng tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
}

/// <summary>
/// DTO cập nhật chuồng
/// </summary>
public class UpdateEnclosureDto
{
    [Required(ErrorMessage = "Phân khu trực thuộc (AreaId) không được để trống")]
    public int AreaId { get; set; }

    [MaxLength(50, ErrorMessage = "Mã chuồng tối đa 50 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên chuồng không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên chuồng tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
    public decimal? MapX { get; set; }
    public decimal? MapY { get; set; }
}

/// <summary>
/// DTO bộ lọc tìm kiếm chuồng
/// </summary>
public class EnclosureFilterDto
{
    public int? AreaId { get; set; }
    public string? Search { get; set; }
    public string? Status { get; set; }
}

/// <summary>
/// DTO chuyển cá thể động vật sang chuồng khác
/// </summary>
public class MoveAnimalDto
{
    [Required(ErrorMessage = "Mã cá thể động vật (AnimalId) không được để trống")]
    public int AnimalId { get; set; }

    public int? TargetEnclosureId { get; set; }
}
