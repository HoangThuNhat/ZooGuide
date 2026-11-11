using System;

namespace ZooGuide.Domain.Entities;

/// <summary>
/// Bảng DEVICE_ACTIVITIES: Giám sát hoạt động thiết bị thực tế một cách trung thực,
/// sử dụng mã định danh cài đặt ngẫu nhiên (pseudonymous installation ID) và ghi nhận heartbeat.
/// </summary>
public class DeviceActivity
{
    public int DeviceActivityId { get; set; }
    public string InstallationId { get; set; } = string.Empty;
    public DateTime FirstSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public string? UserAgent { get; set; }
    public string? IpAddressHash { get; set; }
    public int HeartbeatCount { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? DisconnectedAt { get; set; }
}

/// <summary>
/// Bảng NARRATION_TELEMETRY_EVENTS: Lưu trữ sự kiện vận hành thực tế của hệ thống thuyết minh tự động đa ngôn ngữ
/// (yêu cầu phát audio, bắt đầu phát, hoàn tất, dừng sớm, lỗi tải file/API/phát, phễu kích hoạt GPS tự động,
/// lựa chọn ngôn ngữ của khách tham quan, và trạng thái xử lý cảnh báo vận hành).
/// </summary>
public class NarrationTelemetryEvent
{
    public long TelemetryEventId { get; set; }
    public string Category { get; set; } = "AUDIO"; // AUDIO, GPS, LANGUAGE, SYSTEM, ALERT_STATE
    public string EventType { get; set; } = string.Empty;
    public string? InstallationId { get; set; }
    public Guid? SessionId { get; set; }
    public string? LanguageCode { get; set; }
    public string? TargetType { get; set; } // POI, Animal, Species, Area, Alert
    public int? TargetId { get; set; }
    public string? TargetCode { get; set; }
    public string? TargetName { get; set; }
    public string? TriggerSource { get; set; } // GPS_AUTO, MANUAL_MAP, MANUAL_LIST, QR_SCAN
    public int? ListenDurationSeconds { get; set; }
    public int? TotalDurationSeconds { get; set; }
    public decimal? DistanceMeters { get; set; }
    public decimal? AccuracyMeters { get; set; }
    public bool IsSuccess { get; set; } = true;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
