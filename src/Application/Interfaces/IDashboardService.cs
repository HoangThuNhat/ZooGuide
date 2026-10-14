using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
}
