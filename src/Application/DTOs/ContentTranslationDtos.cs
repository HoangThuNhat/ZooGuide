namespace ZooGuide.Application.DTOs;

public class ContentTranslationDto
{
    public int TranslationId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string EntityKey { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Summary { get; set; }
    public string? Description { get; set; }
    public string? ExtraJson { get; set; }
    public string TranslationStatus { get; set; } = "Published";
    public bool IsPublished { get; set; } = true;
    public string? SourceReference { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpsertContentTranslationDto
{
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string EntityKey { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Summary { get; set; }
    public string? Description { get; set; }
    public string? ExtraJson { get; set; }
    public string TranslationStatus { get; set; } = "Published";
    public bool IsPublished { get; set; } = true;
    public string? SourceReference { get; set; }
}
