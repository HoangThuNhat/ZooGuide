using ZooGuide.Application.DTOs.Species;

namespace ZooGuide.Application.Interfaces;

public interface ISpeciesService
{
    Task<IEnumerable<SpeciesDto>> GetAllAsync();
    Task<SpeciesDto?> GetByIdAsync(int id);
    Task<SpeciesDto> CreateAsync(SpeciesCreateRequest request);
    Task<SpeciesDto?> UpdateAsync(int id, SpeciesUpdateRequest request);
    Task<bool> DeleteAsync(int id);
}
