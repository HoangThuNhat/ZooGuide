using System;
using System.Linq;
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
    private const string AdminDashboardPrefix = "admin_dashboard_";
    private readonly ZooGuideDbContext _context;

    public DeviceTrackingService(ZooGuideDbContext context)
    {
        _context = context;
    }

    private static string NormalizeInstallationId(string installationId)
    {
        var normalized = installationId.Trim();
        if (normalized.Length > 64)
        {
            normalized = normalized.Substring(0, 64);
        }
        return normalized.ToLowerInvariant();
    }

    private static bool IsAdminMonitorId(string? installationId)
    {
        return !string.IsNullOrWhiteSpace(installationId) &&
               installationId.Trim().StartsWith(AdminDashboardPrefix, StringComparison.OrdinalIgnoreCase);
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

        if (IsAdminMonitorId(installationId))
        {
            return new DeviceHeartbeatResponseDto
            {
                Success = false,
                InstallationId = NormalizeInstallationId(installationId),
                ServerTimeUtc = DateTime.UtcNow,
                Message = "Bỏ qua heartbeat từ kết nối giám sát Admin."
            };
        }

        var normalizedId = NormalizeInstallationId(installationId);

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
            .FirstOrDefaultAsync(d => d.InstallationId.ToLower() == normalizedId);

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
                    .FirstOrDefaultAsync(d => d.InstallationId.ToLower() == normalizedId);
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

        var normalizedId = NormalizeInstallationId(installationId);
        var matchingDevices = await _context.DeviceActivities
            .Where(d => d.InstallationId.ToLower() == normalizedId)
            .ToListAsync();

        if (matchingDevices.Count > 0)
        {
            var now = DateTime.UtcNow;
            foreach (var existing in matchingDevices)
            {
                existing.DisconnectedAt = now;
                existing.IsActive = false;
                existing.UpdatedAt = now;
            }
            await _context.SaveChangesAsync();
            return true;
        }

        return false;
    }

    public async Task<int> GetActiveDevicesCountAsync(int thresholdSeconds = 60)
    {
        var effectiveSeconds = Math.Max(1, thresholdSeconds);
        var cutoff = DateTime.UtcNow.AddSeconds(-effectiveSeconds);
        var activeIds = await _context.DeviceActivities
            .AsNoTracking()
            .Where(d => d.IsActive && d.DisconnectedAt == null && d.LastSeenAt >= cutoff && !string.IsNullOrEmpty(d.InstallationId))
            .Select(d => d.InstallationId)
            .ToListAsync();

        return activeIds
            .Where(id => !IsAdminMonitorId(id))
            .Select(NormalizeInstallationId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();
    }

    public async Task<ActiveDevicesSummaryDto> GetSummaryAsync(int thresholdSeconds = 60)
    {
        var now = DateTime.UtcNow;
        var effectiveSeconds = Math.Max(1, thresholdSeconds);
        var cutoffThreshold = now.AddSeconds(-effectiveSeconds);
        var cutoff5Min = now.AddMinutes(-5);
        var cutoff1Hour = now.AddHours(-1);

        var allDevices = await _context.DeviceActivities
            .AsNoTracking()
            .Where(d => !string.IsNullOrEmpty(d.InstallationId))
            .Select(d => new
            {
                d.InstallationId,
                d.IsActive,
                d.DisconnectedAt,
                d.LastSeenAt
            })
            .ToListAsync();

        var visitorDevices = allDevices
            .Where(d => !IsAdminMonitorId(d.InstallationId))
            .ToList();

        var activeThreshold = visitorDevices
            .Where(d => d.IsActive && d.DisconnectedAt == null && d.LastSeenAt >= cutoffThreshold)
            .Select(d => NormalizeInstallationId(d.InstallationId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        var active5Min = visitorDevices
            .Where(d => d.IsActive && d.DisconnectedAt == null && d.LastSeenAt >= cutoff5Min)
            .Select(d => NormalizeInstallationId(d.InstallationId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        var total = visitorDevices
            .Select(d => NormalizeInstallationId(d.InstallationId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        var heartbeats1Hour = visitorDevices
            .Where(d => d.LastSeenAt >= cutoff1Hour)
            .Select(d => NormalizeInstallationId(d.InstallationId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        return new ActiveDevicesSummaryDto
        {
            ActiveCount60Seconds = activeThreshold,
            ActiveCount5Minutes = active5Min,
            TotalTrackedInstallations = total,
            HeartbeatsLastHour = heartbeats1Hour,
            OnlineThresholdSeconds = effectiveSeconds,
            CalculatedAtUtc = now
        };
    }
}
