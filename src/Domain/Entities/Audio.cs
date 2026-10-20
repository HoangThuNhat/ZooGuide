using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng AUDIOS: Quản lý các file âm thanh thuyết minh (URL, tên file, định dạng mime, thời lượng, dung lượng).
/// NGUYÊN TẮC:
/// - Không lưu binary audio file trực tiếp trong SQL Server (chỉ lưu metadata + URL/path lưu trữ).
/// - Quan hệ 1 Narration - N Audios cho phép mở rộng hỗ trợ nhiều chất lượng, giọng đọc (Nam/Nữ) hoặc định dạng.
/// </summary>
public class Audio
{
    public int AudioId { get; set; }
    public int NarrationId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = "audio/mpeg";
    public int? DurationSeconds { get; set; }
    public long? FileSize { get; set; }
    public string? StorageBucket { get; set; } = "narration-audio";
    public string? ObjectPath { get; set; }
    public string? PublicUrl { get; set; }
    public string? LanguageCode { get; set; }
    public string? VoiceName { get; set; }
    public string? TtsProvider { get; set; }
    public string? Sha256Hash { get; set; }
    public bool IsVerified { get; set; }
    public AudioStatus Status { get; set; } = AudioStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Narration Narration { get; set; } = null!;
}
