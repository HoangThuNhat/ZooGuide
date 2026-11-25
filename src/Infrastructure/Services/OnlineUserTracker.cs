using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.Infrastructure.Services;

public class OnlineUserTracker : IOnlineUserTracker, IDisposable
{
    private class DeviceSession
    {
        public string DeviceId { get; }
        public ConcurrentDictionary<string, DateTime> Connections { get; } = new();
        public DateTime LastSeenUtc { get; set; }
        public DateTime? LastHeartbeatUtc { get; set; }
        public bool IsTicketBuyer { get; set; }
        public string? BuyerKey { get; set; }
        public string? OrderCode { get; set; }

        public DeviceSession(string deviceId, bool isTicketBuyer, string? buyerKey, string? orderCode)
        {
            DeviceId = deviceId;
            IsTicketBuyer = isTicketBuyer;
            BuyerKey = buyerKey;
            OrderCode = orderCode;
            LastSeenUtc = DateTime.UtcNow;
        }
    }

    private readonly ConcurrentDictionary<string, DeviceSession> _devices = new(StringComparer.OrdinalIgnoreCase);
    private readonly TimeSpan _inactivityTimeout = TimeSpan.FromSeconds(45);
    private readonly Timer? _cleanupTimer;
    private int _lastActiveBuyers = -1;
    private int _lastActiveDevices = -1;

    public event Action<int, int>? OnCountsChanged;

    public OnlineUserTracker()
    {
        // Timer chạy mỗi 5 giây tự động kiểm tra và dọn dẹp các session hết hạn
        _cleanupTimer = new Timer(_ => CheckAndNotifyExpiredSessions(), null, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
    }

    private const string AdminDashboardPrefix = "admin_dashboard_";

    private static bool IsAdminMonitorId(string? deviceId)
    {
        return !string.IsNullOrWhiteSpace(deviceId) &&
               deviceId.Trim().StartsWith(AdminDashboardPrefix, StringComparison.OrdinalIgnoreCase);
    }

    public bool RegisterDeviceConnection(string deviceId, string connectionId, bool isTicketBuyer = false, string? buyerKey = null, string? orderCode = null)
    {
        if (string.IsNullOrWhiteSpace(deviceId) || IsAdminMonitorId(deviceId)) return false;

        var normalizedDeviceId = NormalizeKey(deviceId);
        var normalizedConnId = !string.IsNullOrWhiteSpace(connectionId) ? connectionId.Trim() : "conn-default";
        var normalizedBuyerKey = !string.IsNullOrWhiteSpace(buyerKey) ? buyerKey.Trim().ToLower() : null;
        var now = DateTime.UtcNow;

        var isNewDevice = false;
        var session = _devices.GetOrAdd(normalizedDeviceId, key =>
        {
            isNewDevice = true;
            return new DeviceSession(key, isTicketBuyer, normalizedBuyerKey, orderCode);
        });

        if (isTicketBuyer)
        {
            session.IsTicketBuyer = true;
            if (!string.IsNullOrWhiteSpace(normalizedBuyerKey))
                session.BuyerKey = normalizedBuyerKey;
            if (!string.IsNullOrWhiteSpace(orderCode))
                session.OrderCode = orderCode;
        }

        session.Connections[normalizedConnId] = now;
        session.LastSeenUtc = now;

        NotifyIfCountsChanged();
        return isNewDevice;
    }

    public bool RemoveDeviceConnection(string deviceId, string? connectionId = null)
    {
        if (string.IsNullOrWhiteSpace(deviceId)) return false;

        var normalizedDeviceId = NormalizeKey(deviceId);

        if (_devices.TryGetValue(normalizedDeviceId, out var session))
        {
            if (string.IsNullOrWhiteSpace(connectionId) || connectionId == "beacon")
            {
                _devices.TryRemove(normalizedDeviceId, out _);
                NotifyIfCountsChanged();
                return true;
            }

            session.Connections.TryRemove(connectionId.Trim(), out _);
            session.LastSeenUtc = DateTime.UtcNow;

            if (session.Connections.IsEmpty)
            {
                _devices.TryRemove(normalizedDeviceId, out _);
                NotifyIfCountsChanged();
                return true;
            }
        }

        NotifyIfCountsChanged();
        return false;
    }

    public void RefreshHeartbeat(string deviceId, string? connectionId = null, bool? isTicketBuyer = null, string? buyerKey = null, string? orderCode = null)
    {
        if (string.IsNullOrWhiteSpace(deviceId) || IsAdminMonitorId(deviceId)) return;

        var normalizedDeviceId = NormalizeKey(deviceId);
        var now = DateTime.UtcNow;
        var connKey = !string.IsNullOrWhiteSpace(connectionId) ? connectionId.Trim() : "http-heartbeat";
        var normalizedBuyerKey = !string.IsNullOrWhiteSpace(buyerKey) ? buyerKey.Trim().ToLower() : null;

        if (_devices.TryGetValue(normalizedDeviceId, out var session))
        {
            session.LastSeenUtc = now;
            session.LastHeartbeatUtc = now;
            session.Connections[connKey] = now;
            if (isTicketBuyer.HasValue && isTicketBuyer.Value)
            {
                session.IsTicketBuyer = true;
            }
            if (!string.IsNullOrWhiteSpace(normalizedBuyerKey))
            {
                session.BuyerKey = normalizedBuyerKey;
            }
            if (!string.IsNullOrWhiteSpace(orderCode))
            {
                session.OrderCode = orderCode;
            }
        }
        else
        {
            var newSession = new DeviceSession(normalizedDeviceId, isTicketBuyer ?? false, normalizedBuyerKey, orderCode)
            {
                LastSeenUtc = now,
                LastHeartbeatUtc = now
            };
            newSession.Connections[connKey] = now;
            _devices.TryAdd(normalizedDeviceId, newSession);
        }

        NotifyIfCountsChanged();
    }

    public void MarkDeviceAsTicketBuyer(string deviceId, string buyerKey, string? orderCode = null)
    {
        if (string.IsNullOrWhiteSpace(deviceId)) return;

        var normalizedDeviceId = NormalizeKey(deviceId);
        var normalizedBuyerKey = !string.IsNullOrWhiteSpace(buyerKey) ? buyerKey.Trim().ToLower() : null;

        if (_devices.TryGetValue(normalizedDeviceId, out var session))
        {
            session.IsTicketBuyer = true;
            if (!string.IsNullOrWhiteSpace(normalizedBuyerKey))
                session.BuyerKey = normalizedBuyerKey;
            if (!string.IsNullOrWhiteSpace(orderCode))
                session.OrderCode = orderCode;
            session.LastSeenUtc = DateTime.UtcNow;
        }

        NotifyIfCountsChanged();
    }

    /// <summary>
    /// Số lượng người mua vé độc lập đang online (chỉ tính khách đã mua vé thành công, còn trong timeout 45s).
    /// </summary>
    public int GetActiveTicketBuyersCount()
    {
        CleanupExpiredSessions();
        return _devices.Values
            .Where(d => d.IsTicketBuyer)
            .Select(d => !string.IsNullOrEmpty(d.BuyerKey) ? d.BuyerKey : d.DeviceId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();
    }

    /// <summary>
/// Số thiết bị đã xác minh là người mua vé đang hoạt động.
/// Mỗi DeviceId chỉ được tính một lần, không gộp theo email.
/// </summary>
public int GetActiveTicketBuyerDevicesCount()
{
    CleanupExpiredSessions();

    return _devices.Values
        .Count(d => d.IsTicketBuyer);
}

    /// <summary>
    /// Số lượng thiết bị đang hoạt động (cả người chưa mua vé và đã mua vé, còn trong timeout 45s, loại trừ kết nối giám sát Admin).
    /// </summary>
    public int GetActiveDevicesCount()
    {
        CleanupExpiredSessions();
        return _devices.Values.Count(d => !IsAdminMonitorId(d.DeviceId));
    }

    public IReadOnlyCollection<string> GetActiveDeviceIds(int withinMinutes = 5, bool requireActivityProof = false)
    {
        CleanupExpiredSessions();
        var cutoff = DateTime.UtcNow.AddMinutes(-Math.Max(1, withinMinutes));

        return _devices.Values
            .Where(d => !IsAdminMonitorId(d.DeviceId))
            .Where(d => d.LastSeenUtc >= cutoff)
            .Where(d => !requireActivityProof || (d.LastHeartbeatUtc.HasValue && d.LastHeartbeatUtc.Value >= cutoff))
            .Select(d => d.DeviceId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>
    /// Tổng số tab/kết nối đang hoạt động của người mua vé.
    /// </summary>
    public int GetActiveBuyerConnectionsCount()
    {
        CleanupExpiredSessions();
        return _devices.Values
            .Where(d => d.IsTicketBuyer)
            .Sum(d => d.Connections.Count);
    }

    public int GetOnlineUsersCount()
    {
        return GetActiveTicketBuyersCount();
    }

    public int GetActiveConnectionsCount()
    {
        CleanupExpiredSessions();
        return _devices.Values.Sum(d => d.Connections.Count);
    }

    // Tương thích ngược với các hàm identifier
    public bool RegisterConnection(string identifier, string connectionId, bool isTicketBuyer = false)
    {
        string deviceId = identifier;
        string? buyerKey = null;
        if (identifier.StartsWith("buyer:", StringComparison.OrdinalIgnoreCase))
        {
            buyerKey = identifier[6..].Trim().ToLower();
            deviceId = $"buyer-{buyerKey}";
            isTicketBuyer = true;
        }
        else if (identifier.StartsWith("vis:", StringComparison.OrdinalIgnoreCase))
        {
            deviceId = identifier[4..].Trim();
        }

        return RegisterDeviceConnection(deviceId, connectionId, isTicketBuyer, buyerKey);
    }

    public bool RemoveConnection(string identifier, string? connectionId = null)
    {
        string deviceId = identifier;
        if (identifier.StartsWith("buyer:", StringComparison.OrdinalIgnoreCase))
        {
            deviceId = $"buyer-{identifier[6..].Trim().ToLower()}";
        }
        else if (identifier.StartsWith("vis:", StringComparison.OrdinalIgnoreCase))
        {
            deviceId = identifier[4..].Trim();
        }

        return RemoveDeviceConnection(deviceId, connectionId);
    }

    public void RefreshHeartbeat(string identifier, string? connectionId = null, bool? isTicketBuyer = null)
    {
        string deviceId = identifier;
        string? buyerKey = null;
        if (identifier.StartsWith("buyer:", StringComparison.OrdinalIgnoreCase))
        {
            buyerKey = identifier[6..].Trim().ToLower();
            deviceId = $"buyer-{buyerKey}";
            isTicketBuyer = true;
        }
        else if (identifier.StartsWith("vis:", StringComparison.OrdinalIgnoreCase))
        {
            deviceId = identifier[4..].Trim();
        }

        RefreshHeartbeat(deviceId, connectionId, isTicketBuyer, buyerKey);
    }

    public void MarkAsTicketBuyer(string identifier)
    {
        string deviceId = identifier;
        string? buyerKey = null;
        if (identifier.StartsWith("buyer:", StringComparison.OrdinalIgnoreCase))
        {
            buyerKey = identifier[6..].Trim().ToLower();
            deviceId = $"buyer-{buyerKey}";
        }
        else if (identifier.StartsWith("vis:", StringComparison.OrdinalIgnoreCase))
        {
            deviceId = identifier[4..].Trim();
        }

        MarkDeviceAsTicketBuyer(deviceId, buyerKey ?? deviceId);
    }

    public void ClearAll()
    {
        _devices.Clear();
        _lastActiveBuyers = 0;
        _lastActiveDevices = 0;
        NotifyIfCountsChanged();
    }

    private void CleanupExpiredSessions()
    {
        var cutoff = DateTime.UtcNow - _inactivityTimeout;

        foreach (var kvp in _devices)
        {
            var session = kvp.Value;

            foreach (var conn in session.Connections)
            {
                if (conn.Value < cutoff)
                {
                    session.Connections.TryRemove(conn.Key, out _);
                }
            }

            if (session.Connections.IsEmpty || session.LastSeenUtc < cutoff)
            {
                _devices.TryRemove(kvp.Key, out _);
            }
        }
    }

    private void CheckAndNotifyExpiredSessions()
    {
        CleanupExpiredSessions();
        NotifyIfCountsChanged();
    }

    private void NotifyIfCountsChanged()
    {
        var currentBuyers = _devices.Values
            .Where(d => d.IsTicketBuyer)
            .Select(d => !string.IsNullOrEmpty(d.BuyerKey) ? d.BuyerKey : d.DeviceId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        var currentDevices = _devices.Values.Count(d => !IsAdminMonitorId(d.DeviceId));

        if (currentBuyers != _lastActiveBuyers || currentDevices != _lastActiveDevices)
        {
            _lastActiveBuyers = currentBuyers;
            _lastActiveDevices = currentDevices;
            try
            {
                OnCountsChanged?.Invoke(currentBuyers, currentDevices);
            }
            catch {}
        }
    }

    private static string NormalizeKey(string key)
    {
        return key.Trim().ToLowerInvariant();
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
    }
}
