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
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO yêu cầu tạo mới chuồng trại (Enclosure)
/// </summary>
public class CreateEnclosureRequest
{
    [Required(ErrorMessage = "AreaId không được để trống")]
    [Range(1, int.MaxValue, ErrorMessage = "AreaId phải lớn hơn 0")]
    public int AreaId { get; set; }

    [Required(ErrorMessage = "Tên chuồng không được để trống")]
    [MaxLength(200, ErrorMessage = "Tên chuồng tối đa 200 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "Đường dẫn hình ảnh tối đa 500 ký tự")]
    public string? ImageUrl { get; set; }

    [MaxLength(50, ErrorMessage = "Trạng thái tối đa 50 ký tự")]
    public string Status { get; set; } = "Active";
}

/// <summary>
/// DTO yêu cầu cập nhật chuồng trại (Enclosure)
/// </summary>
public class UpdateEnclosureRequest
{
    [Required(ErrorMessage = "AreaId không được để trống")]
    [Range(1, int.MaxValue, ErrorMessage = "AreaId phải lớn hơn 0")]
    public int AreaId { get; set; }

    [Required(ErrorMessage = "Tên chuồng không được để trống")]
    [MaxLength(200, ErrorMessage = "Tên chuồng tối đa 200 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "Đường dẫn hình ảnh tối đa 500 ký tự")]
    public string? ImageUrl { get; set; }

    [MaxLength(50, ErrorMessage = "Trạng thái tối đa 50 ký tự")]
    public string Status { get; set; } = "Active";
}
