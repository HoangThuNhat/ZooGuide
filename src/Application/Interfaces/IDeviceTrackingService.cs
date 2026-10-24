using System.Threading.Tasks;
using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IDeviceTrackingService
{
    Task<DeviceHeartbeatResponseDto> RecordHeartbeatAsync(string installationId, string? userAgent = null, string? ipAddress = null);
    Task<int> GetActiveDevicesCountAsync(int recentMinutes = 5);
    Task<ActiveDevicesSummaryDto> GetSummaryAsync();
}
