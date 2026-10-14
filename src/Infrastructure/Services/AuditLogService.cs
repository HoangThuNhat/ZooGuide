using System.Collections.Concurrent;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private static readonly ConcurrentQueue<AuditLogEntryDto> _logs = new();

    public void Log(string action, string targetEntity, string targetId, string details, bool success = true, string performedBy = "Admin")
    {
        var entry = new AuditLogEntryDto
        {
            Action = action,
            TargetEntity = targetEntity,
            TargetId = targetId,
            Details = details,
            Success = success,
            PerformedBy = performedBy,
            Timestamp = DateTime.UtcNow
        };

        _logs.Enqueue(entry);

        // Giữ tối đa 500 logs gần nhất
        while (_logs.Count > 500)
        {
            _logs.TryDequeue(out _);
        }
    }

    public IEnumerable<AuditLogEntryDto> GetLogs(int limit = 50)
    {
        return _logs.Reverse().Take(limit).ToList();
    }
}
