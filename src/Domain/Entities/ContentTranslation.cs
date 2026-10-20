namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng CONTENT_TRANSLATIONS: Quản lý bản dịch đa ngôn ngữ cho UI và các thực thể nghiệp vụ
/// (Area, Enclosure, Species, Animal, TicketType) theo mã ngôn ngữ (vi, en, zh, ja, ko, th, fr, es, de, ru, pt, id...).
/// Ràng buộc duy nhất: UNIQUE(EntityType, EntityId, EntityKey, LanguageCode).
/// </summary>
public class ContentTranslation
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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
