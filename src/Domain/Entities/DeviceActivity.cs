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
