using ZooGuide.Application.DTOs.Species;

namespace ZooGuide.Application.Interfaces;

public interface ISpeciesService
{
    Task<IEnumerable<SpeciesDto>> GetAllAsync(string? search = null, string? conservationStatus = null, string? lang = null);
    Task<SpeciesDto?> GetByIdAsync(int id, string? lang = null);
    Task<SpeciesDto> CreateAsync(SpeciesCreateRequest request);
    Task<SpeciesDto?> UpdateAsync(int id, SpeciesUpdateRequest request);
    Task<bool> DeleteAsync(int id);
}
