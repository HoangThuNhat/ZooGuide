using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IAuditLogService
{
    void Log(string action, string targetEntity, string targetId, string details, bool success = true, string performedBy = "Admin");
    IEnumerable<AuditLogEntryDto> GetLogs(int limit = 50);
}
