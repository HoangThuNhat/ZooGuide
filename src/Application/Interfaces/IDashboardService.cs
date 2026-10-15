using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(DateTime? fromDate = null, DateTime? toDate = null);
}
