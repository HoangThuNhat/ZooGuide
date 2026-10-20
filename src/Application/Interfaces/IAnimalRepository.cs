using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface thao tác dữ liệu bảng ANIMALS
/// </summary>
public interface IAnimalRepository
{
    Task<List<Animal>> GetAllWithDetailsAsync(string? search, int? areaId, string? zoneId, int? speciesId, string? iucnStatus, int? enclosureId = null);
    Task<Animal?> GetByIdWithDetailsAsync(int animalId);
    Task<Animal?> GetByIdAsync(int animalId);
    Task<Animal> AddAsync(Animal animal);
    Task UpdateAsync(Animal animal);
    Task DeleteAsync(Animal animal);
    Task<bool> HasNarrationsAsync(int animalId);
    Task<bool> SpeciesExistsAsync(int speciesId);
    Task<bool> AreaExistsAsync(int areaId);
    Task<bool> EnclosureExistsAsync(int enclosureId);
    Task<List<ContentTranslation>> GetTranslationsByLanguageAsync(string languageCode);
}
