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

        // Privacy-conscious IP hash (never store or log raw IP address)
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
                CreatedAt = now,
                IsActive = true,
                DisconnectedAt = null
            };
            _context.DeviceActivities.Add(newDevice);

            try
            {
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
            catch (DbUpdateException)
            {
                // Xử lý race condition khi 2 request đầu tiên tới đồng thời
                _context.Entry(newDevice).State = EntityState.Detached;
                existing = await _context.DeviceActivities
                    .FirstOrDefaultAsync(d => d.InstallationId == normalizedId);
            }
        }

        if (existing != null)
        {
            existing.LastSeenAt = now;
            existing.HeartbeatCount += 1;
            existing.UpdatedAt = now;
            existing.IsActive = true;
            existing.DisconnectedAt = null;

            if (!string.IsNullOrWhiteSpace(sanitizedUserAgent))
            {
                existing.UserAgent = sanitizedUserAgent;
            }
            if (!string.IsNullOrWhiteSpace(ipHash))
            {
                existing.IpAddressHash = ipHash;
            }

            await _context.SaveChangesAsync();

            return new DeviceHeartbeatResponseDto
            {
                Success = true,
                InstallationId = normalizedId,
                ServerTimeUtc = now,
                HeartbeatCount = existing.HeartbeatCount,
                Message = "Heartbeat ghi nhận thành công."
            };
        }

        return new DeviceHeartbeatResponseDto
        {
            Success = false,
            InstallationId = normalizedId,
            ServerTimeUtc = now,
            Message = "Không thể ghi nhận heartbeat cho thiết bị."
        };
    }

    public async Task<bool> RecordDisconnectAsync(string installationId)
    {
        if (string.IsNullOrWhiteSpace(installationId)) return false;

        var normalizedId = installationId.Trim();
        var existing = await _context.DeviceActivities
            .FirstOrDefaultAsync(d => d.InstallationId == normalizedId);

        if (existing != null)
        {
            var now = DateTime.UtcNow;
            existing.DisconnectedAt = now;
            existing.IsActive = false;
            existing.UpdatedAt = now;
            await _context.SaveChangesAsync();
            return true;
        }

        return false;
    }

    public async Task<int> GetActiveDevicesCountAsync(int thresholdSeconds = 60)
    {
        var cutoff = DateTime.UtcNow.AddSeconds(-thresholdSeconds);
        return await _context.DeviceActivities
            .AsNoTracking()
            .CountAsync(d => d.LastSeenAt >= cutoff);
    }

    public async Task<ActiveDevicesSummaryDto> GetSummaryAsync(int thresholdSeconds = 60)
    {
        var now = DateTime.UtcNow;
        var cutoffThreshold = now.AddSeconds(-thresholdSeconds);
        var cutoff5Min = now.AddMinutes(-5);
        var cutoff1Hour = now.AddHours(-1);

        var activeThreshold = await _context.DeviceActivities
            .AsNoTracking()
            .CountAsync(d => d.LastSeenAt >= cutoffThreshold);

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
            ActiveCount60Seconds = activeThreshold,
            ActiveCount5Minutes = active5Min,
            TotalTrackedInstallations = total,
            HeartbeatsLastHour = heartbeats1Hour,
            OnlineThresholdSeconds = thresholdSeconds,
            CalculatedAtUtc = now
        };
    }
}
