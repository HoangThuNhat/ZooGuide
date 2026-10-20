namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng LANGUAGES: Danh mục các ngôn ngữ hỗ trợ thuyết minh tự động (vi, en, zh, ja, ko...).
/// </summary>
public class Language
{
    public int LanguageId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NativeName { get; set; }
    public string? Locale { get; set; }
    public string? FlagIcon { get; set; }
    public string? TtsVoice { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Narration> Narrations { get; set; } = new List<Narration>();
}
