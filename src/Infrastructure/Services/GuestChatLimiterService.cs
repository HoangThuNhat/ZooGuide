using System.Collections.Concurrent;
using System.Text.Json;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.Infrastructure.Services;

public class GuestChatLimiterService : IGuestChatLimiterService
{
    private const int MaxGuestQuestions = 3;
    private readonly ConcurrentDictionary<string, GuestQuotaRecord> _store = new();
    private readonly string _storagePath;
    private readonly object _fileLock = new();

    public GuestChatLimiterService()
    {
        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var dataDir = Path.Combine(baseDir, "App_Data");
        try
        {
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }
        }
        catch
        {
            dataDir = baseDir;
        }

        _storagePath = Path.Combine(dataDir, "guest_chat_quota.json");
        LoadFromDisk();
    }

    public (int usedCount, int remaining, bool isLimitReached) GetQuota(string guestId)
    {
        if (string.IsNullOrWhiteSpace(guestId))
        {
            return (0, MaxGuestQuestions, false);
        }

        var record = _store.GetOrAdd(guestId, _ => new GuestQuotaRecord());
        lock (record.LockObj)
        {
            var remaining = Math.Max(0, MaxGuestQuestions - record.UsedCount);
            return (record.UsedCount, remaining, record.UsedCount >= MaxGuestQuestions);
        }
    }

    public (bool allowed, int remaining, string message) TryConsume(string guestId, string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            var quota = GetQuota(guestId);
            return (true, quota.remaining, string.Empty);
        }

        if (string.IsNullOrWhiteSpace(guestId))
        {
            return (false, 0, "Không xác định được phiên truy cập khách.");
        }

        var record = _store.GetOrAdd(guestId, _ => new GuestQuotaRecord());
        lock (record.LockObj)
        {
            if (record.UsedCount >= MaxGuestQuestions)
            {
                return (false, 0, "Bạn đã sử dụng hết 3 câu hỏi miễn phí. Vui lòng kích hoạt vé tham quan hợp lệ để tiếp tục sử dụng chatbot.");
            }

            record.UsedCount++;
            record.LastUsedAt = DateTime.UtcNow;
            var remaining = Math.Max(0, MaxGuestQuestions - record.UsedCount);

            SaveToDiskAsync();
            return (true, remaining, string.Empty);
        }
    }

    public void ResetQuota(string guestId)
    {
        if (string.IsNullOrWhiteSpace(guestId)) return;
        if (_store.TryGetValue(guestId, out var record))
        {
            lock (record.LockObj)
            {
                record.UsedCount = 0;
            }
            SaveToDiskAsync();
        }
    }

    private void LoadFromDisk()
    {
        try
        {
            if (File.Exists(_storagePath))
            {
                var json = File.ReadAllText(_storagePath);
                var dict = JsonSerializer.Deserialize<Dictionary<string, int>>(json);
                if (dict != null)
                {
                    foreach (var (k, v) in dict)
                    {
                        _store[k] = new GuestQuotaRecord { UsedCount = v };
                    }
                }
            }
        }
        catch
        {
            // Fallback graceful
        }
    }

    private void SaveToDiskAsync()
    {
        // Fire and forget save to avoid blocking request thread
        ThreadPool.QueueUserWorkItem(_ =>
        {
            lock (_fileLock)
            {
                try
                {
                    var snapshot = _store.ToDictionary(kv => kv.Key, kv => kv.Value.UsedCount);
                    var json = JsonSerializer.Serialize(snapshot);
                    File.WriteAllText(_storagePath, json);
                }
                catch
                {
                    // Ignore disk errors
                }
            }
        });
    }

    public class GuestQuotaRecord
    {
        public int UsedCount { get; set; } = 0;
        public DateTime FirstUsedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;
        public readonly object LockObj = new object();
    }
}
