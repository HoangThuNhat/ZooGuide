using ZooGuide.Domain.Enums;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng NARRATIONS: Trọng tâm của đề tài "Thuyết minh tự động đa ngôn ngữ".
/// QUY TẮC THIẾT KẾ:
/// - UNIQUE(AnimalId, LanguageId): Một con vật chỉ có 1 bài thuyết minh active theo mỗi ngôn ngữ.
/// - CreatedBy liên kết với bảng USERS để truy vết nhân viên/quản trị viên biên tập nội dung.
/// - Không duplicate dữ liệu text của Language; tham chiếu qua LanguageId.
/// - AudioUrl dùng để truy cập nhanh file âm thanh chính thức; chi tiết các phiên bản audio quản lý ở bảng AUDIOS.
/// </summary>
public class Narration
{
    public int NarrationId { get; set; }
    public int AnimalId { get; set; }
    public int LanguageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public NarrationStatus Status { get; set; } = NarrationStatus.Published;
    public string? ReferenceSource { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Animal Animal { get; set; } = null!;
    public virtual Language Language { get; set; } = null!;
    public virtual User Creator { get; set; } = null!;
    public virtual ICollection<Audio> Audios { get; set; } = new List<Audio>();
}
