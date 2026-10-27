using System;

namespace ZooGuide.Application.DTOs;

public class DeviceHeartbeatRequestDto
{
    public string InstallationId { get; set; } = string.Empty;
    public string? OrderCode { get; set; }
    public string? BuyerEmail { get; set; }
}

public class DeviceHeartbeatResponseDto
{
    public bool Success { get; set; }
    public string InstallationId { get; set; } = string.Empty;
    public DateTime ServerTimeUtc { get; set; }
    public int HeartbeatCount { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ActiveDevicesSummaryDto
{
    public int ActiveCount60Seconds { get; set; }
    public int ActiveCount5Minutes { get; set; }
    public int TotalTrackedInstallations { get; set; }
    public int HeartbeatsLastHour { get; set; }
    public int OnlineThresholdSeconds { get; set; } = 60;
    public DateTime CalculatedAtUtc { get; set; }
}
