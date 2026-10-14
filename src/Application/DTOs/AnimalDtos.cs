using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.DTOs;

/// <summary>
/// DTO trả về thông tin danh sách động vật
/// </summary>
public class AnimalResponseDto
{
    public int AnimalId { get; set; }
    public int Id => AnimalId;                             // Tương thích frontend: a.id
    public string Code => $"ANI-{AnimalId:D3}";             // Tương thích frontend: ANI-001
    public int SpeciesId { get; set; }
    public string SpeciesName { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public string? ConservationStatus { get; set; }
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public int? EnclosureId { get; set; }
    public string? EnclosureName { get; set; }
    public string? EnclosureCode { get; set; }
    public string ZoneId => $"zone-{(AreaId > 0 ? ((char)('a' + (AreaId - 1) % 26)).ToString() : "a")}";
    public string ZoneCode => (AreaId > 0 ? ((char)('A' + (AreaId - 1) % 26)).ToString() : "A");
    public string Name { get; set; } = string.Empty;
    public string NameVi => Name;                           // Tương thích frontend
    public string? Description { get; set; }
    public string Gender { get; set; } = "Unknown";
    public DateOnly? DateOfBirth { get; set; }
    public string? Origin { get; set; }
    public string? HealthStatus { get; set; }
    public string? ConservationNote { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO chi tiết động vật kèm thông tin giống loài và khu vực
/// </summary>
public class AnimalDetailDto : AnimalResponseDto
{
    public SpeciesDetailDto? Species { get; set; }
    public AreaResponseDto? Area { get; set; }
    public EnclosureResponseDto? Enclosure { get; set; }
}

/// <summary>
/// DTO thông tin giống loài
/// </summary>
public class SpeciesDetailDto
{
    public int SpeciesId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public string? Description { get; set; }
    public string? ConservationStatus { get; set; }
    public string? ImageUrl { get; set; }
}

/// <summary>
/// DTO tạo mới động vật
/// </summary>
public class CreateAnimalDto
{
    public int SpeciesId { get; set; } = 1;

    private int _areaId;
    public int AreaId 
    { 
        get 
        {
            if (_areaId > 0) return _areaId;
            if (int.TryParse(ZoneCode, out int parsedCode)) return parsedCode;
            if (int.TryParse(ZoneId, out int parsedZone)) return parsedZone;
            if (!string.IsNullOrWhiteSpace(ZoneCode) && ZoneCode.Length == 1 && char.IsLetter(ZoneCode[0]))
                return char.ToUpper(ZoneCode[0]) - 'A' + 1;
            if (!string.IsNullOrWhiteSpace(ZoneId) && ZoneId.StartsWith("zone-", StringComparison.OrdinalIgnoreCase))
            {
                var suffix = ZoneId.Substring(5);
                if (int.TryParse(suffix, out int parsedSuffix))
                    return parsedSuffix;
                if (suffix.Length == 1 && char.IsLetter(suffix[0]))
                    return char.ToUpper(suffix[0]) - 'A' + 1;
            }
            return _areaId;
        }
        set => _areaId = value; 
    }

    public string? ZoneId { get; set; }
    public string? ZoneCode { get; set; }

    private string _name = string.Empty;
    [Required(ErrorMessage = "Tên động vật không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên động vật tối đa 100 ký tự")]
    public string Name 
    { 
        get => string.IsNullOrWhiteSpace(_name) ? NameVi : _name; 
        set => _name = value; 
    }

    public string NameVi { get; set; } = string.Empty;

    public string? Description { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AnimalGender Gender { get; set; } = AnimalGender.Unknown;
    public DateOnly? DateOfBirth { get; set; }
    public string? Origin { get; set; }
    public string? HealthStatus { get; set; }
    public string? ConservationNote { get; set; }
    public string? ImageUrl { get; set; }
    public int? EnclosureId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AnimalStatus Status { get; set; } = AnimalStatus.Active;
}

/// <summary>
/// DTO cập nhật động vật
/// </summary>
public class UpdateAnimalDto
{
    public int SpeciesId { get; set; } = 1;

    private int _areaId;
    public int AreaId 
    { 
        get 
        {
            if (_areaId > 0) return _areaId;
            if (int.TryParse(ZoneCode, out int parsedCode)) return parsedCode;
            if (int.TryParse(ZoneId, out int parsedZone)) return parsedZone;
            if (!string.IsNullOrWhiteSpace(ZoneCode) && ZoneCode.Length == 1 && char.IsLetter(ZoneCode[0]))
                return char.ToUpper(ZoneCode[0]) - 'A' + 1;
            if (!string.IsNullOrWhiteSpace(ZoneId) && ZoneId.StartsWith("zone-", StringComparison.OrdinalIgnoreCase))
            {
                var suffix = ZoneId.Substring(5);
                if (int.TryParse(suffix, out int parsedSuffix))
                    return parsedSuffix;
                if (suffix.Length == 1 && char.IsLetter(suffix[0]))
                    return char.ToUpper(suffix[0]) - 'A' + 1;
            }
            return _areaId;
        }
        set => _areaId = value; 
    }

    public string? ZoneId { get; set; }
    public string? ZoneCode { get; set; }

    private string _name = string.Empty;
    [Required(ErrorMessage = "Tên động vật không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên động vật tối đa 100 ký tự")]
    public string Name 
    { 
        get => string.IsNullOrWhiteSpace(_name) ? NameVi : _name; 
        set => _name = value; 
    }

    public string NameVi { get; set; } = string.Empty;

    public string? Description { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AnimalGender Gender { get; set; } = AnimalGender.Unknown;
    public DateOnly? DateOfBirth { get; set; }
    public string? Origin { get; set; }
    public string? HealthStatus { get; set; }
    public string? ConservationNote { get; set; }
    public string? ImageUrl { get; set; }
    public int? EnclosureId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AnimalStatus Status { get; set; } = AnimalStatus.Active;
}

/// <summary>
/// DTO bộ lọc tìm kiếm động vật
/// </summary>
public class AnimalFilterDto
{
    public string? Search { get; set; }
    public int? AreaId { get; set; }
    public string? ZoneId { get; set; }
    public int? EnclosureId { get; set; }
    public int? SpeciesId { get; set; }
    public string? IucnStatus { get; set; }
}
