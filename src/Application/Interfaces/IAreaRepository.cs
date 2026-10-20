using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface thao tác dữ liệu bảng AREAS
/// </summary>
public interface IAreaRepository
{
    Task<List<Area>> GetAllWithAnimalsAsync();
    Task<Area?> GetByIdWithAnimalsAsync(int areaId);
    Task<Area?> GetByIdAsync(int areaId);
    Task<Area?> GetByNameAsync(string name);
    Task<Area> AddAsync(Area area);
    Task UpdateAsync(Area area);
    Task DeleteAsync(Area area);
    Task<bool> HasAnimalsAsync(int areaId);
    Task<List<ContentTranslation>> GetTranslationsByLanguageAsync(string languageCode);
}
