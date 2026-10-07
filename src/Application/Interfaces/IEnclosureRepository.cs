using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface thao tác dữ liệu bảng ENCLOSURES
/// </summary>
public interface IEnclosureRepository
{
    Task<List<Enclosure>> GetAllAsync();
    Task<Enclosure?> GetByIdAsync(int enclosureId);
    Task<List<Enclosure>> GetByAreaIdAsync(int areaId);
    Task<Enclosure> CreateAsync(Enclosure enclosure);
    Task UpdateAsync(Enclosure enclosure);
    Task DeleteAsync(Enclosure enclosure);
}
