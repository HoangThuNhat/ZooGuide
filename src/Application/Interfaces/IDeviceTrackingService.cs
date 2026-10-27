using System.Threading.Tasks;
using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IDeviceTrackingService
{
    Task<DeviceHeartbeatResponseDto> RecordHeartbeatAsync(string installationId, string? userAgent = null, string? ipAddress = null);
    Task<bool> RecordDisconnectAsync(string installationId);
    Task<int> GetActiveDevicesCountAsync(int thresholdSeconds = 60);
    Task<ActiveDevicesSummaryDto> GetSummaryAsync(int thresholdSeconds = 60);
}
