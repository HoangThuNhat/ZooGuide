using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface nghiệp vụ quản lý động vật (Animals)
/// </summary>
public interface IAnimalService
{
    Task<IEnumerable<AnimalResponseDto>> GetAnimalsAsync(AnimalFilterDto? filter);
    Task<AnimalDetailDto?> GetAnimalByIdAsync(int animalId, string? lang = null);
    Task<(AnimalResponseDto? Data, string? ErrorMessage)> CreateAnimalAsync(CreateAnimalDto dto);
    Task<(AnimalResponseDto? Data, string? ErrorMessage, bool NotFound)> UpdateAnimalAsync(int animalId, UpdateAnimalDto dto);
    Task<AnimalResponseDto?> UpdateAnimalHealthAsync(int animalId, UpdateAnimalHealthDto dto);
    Task<(bool Success, bool NotFound, bool HasConflict, string? Message)> DeleteAnimalAsync(int animalId);
}
