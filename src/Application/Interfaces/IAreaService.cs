using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface nghiệp vụ quản lý khu vực (Areas)
/// </summary>
public interface IAreaService
{
    Task<IEnumerable<AreaResponseDto>> GetAllAreasAsync(string? lang = null);
    Task<AreaResponseDto?> GetAreaByIdAsync(int areaId, string? lang = null);
    Task<AreaResponseDto> CreateAreaAsync(CreateAreaDto dto);
    Task<AreaResponseDto?> UpdateAreaAsync(int areaId, UpdateAreaDto dto);
    Task<(bool Success, bool HasConflict, string? Message)> DeleteAreaAsync(int areaId);
    Task<AreaNavigationDto?> GetNavigationToAreaAsync(int areaId, decimal userLat, decimal userLng);
}
