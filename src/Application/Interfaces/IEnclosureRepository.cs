using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

public interface IEnclosureRepository
{
    Task<List<Enclosure>> GetAllWithDetailsAsync(int? areaId = null, string? search = null, string? status = null);
    Task<Enclosure?> GetByIdWithDetailsAsync(int enclosureId);
    Task<Enclosure?> GetByIdAsync(int enclosureId);
    Task<Enclosure?> GetByCodeAsync(string code);
    Task<Enclosure> AddAsync(Enclosure enclosure);
    Task UpdateAsync(Enclosure enclosure);
    Task DeleteAsync(Enclosure enclosure);
    Task<bool> HasAnimalsAsync(int enclosureId);
    Task<bool> AreaExistsAsync(int areaId);
}
