using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class DeviceTrackingService : IDeviceTrackingService
{
    private readonly ZooGuideDbContext _context;

    public DeviceTrackingService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<DeviceHeartbeatResponseDto> RecordHeartbeatAsync(
        string installationId, 
        string? userAgent = null, 
        string? ipAddress = null)
    {
        if (string.IsNullOrWhiteSpace(installationId))
        {
            return new DeviceHeartbeatResponseDto
            {
                Success = false,
                Message = "Installation ID không hợp lệ."
            };
        }

        var normalizedId = installationId.Trim();
        if (normalizedId.Length > 64)
        {
            normalizedId = normalizedId.Substring(0, 64);
        }

        var sanitizedUserAgent = !string.IsNullOrWhiteSpace(userAgent) && userAgent.Length > 255
            ? userAgent.Substring(0, 255)
            : userAgent;

        string? ipHash = null;
        if (!string.IsNullOrWhiteSpace(ipAddress))
        {
            using var sha = SHA256.Create();
            var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(ipAddress));
            ipHash = Convert.ToHexString(hashBytes)[..16].ToLowerInvariant();
        }

        var now = DateTime.UtcNow;

        var existing = await _context.DeviceActivities
            .FirstOrDefaultAsync(d => d.InstallationId == normalizedId);

        if (existing == null)
        {
            var newDevice = new DeviceActivity
            {
                InstallationId = normalizedId,
                FirstSeenAt = now,
                LastSeenAt = now,
                UserAgent = sanitizedUserAgent,
                IpAddressHash = ipHash,
                HeartbeatCount = 1,
                CreatedAt = now
            };
            _context.DeviceActivities.Add(newDevice);
            await _context.SaveChangesAsync();

            return new DeviceHeartbeatResponseDto
            {
                Success = true,
                InstallationId = normalizedId,
                ServerTimeUtc = now,
                HeartbeatCount = 1,
                Message = "Thiết bị mới đã được ghi nhận."
            };
        }

        // Deduplicate rapid heartbeats within 10 seconds to avoid flooding
        if ((now - existing.LastSeenAt).TotalSeconds >= 10)
        {
            existing.LastSeenAt = now;
            existing.HeartbeatCount += 1;
            existing.UpdatedAt = now;
            if (!string.IsNullOrWhiteSpace(sanitizedUserAgent))
            {
                existing.UserAgent = sanitizedUserAgent;
            }
            if (!string.IsNullOrWhiteSpace(ipHash))
            {
                existing.IpAddressHash = ipHash;
            }
            await _context.SaveChangesAsync();
        }

        return new DeviceHeartbeatResponseDto
        {
            Success = true,
            InstallationId = normalizedId,
            ServerTimeUtc = now,
            HeartbeatCount = existing.HeartbeatCount,
            Message = "Heartbeat ghi nhận thành công."
        };
    }

    public async Task<int> GetActiveDevicesCountAsync(int recentMinutes = 5)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-recentMinutes);
        return await _context.DeviceActivities
            .AsNoTracking()
            .CountAsync(d => d.LastSeenAt >= cutoff);
    }

    public async Task<ActiveDevicesSummaryDto> GetSummaryAsync()
    {
        var now = DateTime.UtcNow;
        var cutoff5Min = now.AddMinutes(-5);
        var cutoff1Hour = now.AddHours(-1);

        var active5Min = await _context.DeviceActivities
            .AsNoTracking()
            .CountAsync(d => d.LastSeenAt >= cutoff5Min);

        var total = await _context.DeviceActivities
            .AsNoTracking()
            .CountAsync();

        var heartbeats1Hour = await _context.DeviceActivities
            .AsNoTracking()
            .CountAsync(d => d.LastSeenAt >= cutoff1Hour);

        return new ActiveDevicesSummaryDto
        {
            ActiveCount5Minutes = active5Min,
            TotalTrackedInstallations = total,
            HeartbeatsLastHour = heartbeats1Hour,
            CalculatedAtUtc = now
        };
    }
}
