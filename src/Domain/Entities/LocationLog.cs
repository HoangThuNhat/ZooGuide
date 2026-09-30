namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng LOCATION_LOGS: Lưu vết nhật ký GPS theo phiên tham quan (tùy chọn / mở rộng).
/// NGUYÊN TẮC:
/// - Không lưu UserId trực tiếp vì đã liên kết qua SessionId.
/// - Không lưu toàn bộ ping liên tục gây phình to database; chỉ log các mốc quan trọng hoặc theo chu kỳ hợp lý.
/// </summary>
public class LocationLog
{
    public long LocationLogId { get; set; }
    public Guid SessionId { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal? Accuracy { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual TicketSession Session { get; set; } = null!;
}
