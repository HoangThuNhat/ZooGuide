using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.DTOs;

public class NarrationResponseDto
{
    public int NarrationId { get; set; }
    public int AnimalId { get; set; }
    public string AnimalName { get; set; } = string.Empty;
    public string? AnimalImageUrl { get; set; }
    public int LanguageId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string DurationFormatted => DurationSeconds.HasValue 
        ? $"{DurationSeconds.Value / 60}:{DurationSeconds.Value % 60:D2}" 
        : "0:00";
    public string Status { get; set; } = "Draft";
    public int CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AudioResponseDto> Audios { get; set; } = new();
}

public class AudioResponseDto
{
    public int AudioId { get; set; }
    public int NarrationId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = "audio/mpeg";
    public int? DurationSeconds { get; set; }
    public long? FileSize { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
}

public class CreateNarrationDto
{
    public int AnimalId { get; set; }
    public int LanguageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string Status { get; set; } = "Published";
    public int? CreatedBy { get; set; }
}

public class UpdateNarrationDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string Status { get; set; } = "Published";
}

public class UpdateNarrationStatusDto
{
    public string Status { get; set; } = "Published";
}

public class NarrationFilterDto
{
    public int? AnimalId { get; set; }
    public string? LanguageCode { get; set; }
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class LanguageDto
{
    public int LanguageId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
