using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IEnclosureService
{
    Task<IEnumerable<EnclosureResponseDto>> GetEnclosuresAsync(EnclosureFilterDto filter);
    Task<EnclosureDetailDto?> GetEnclosureByIdAsync(int id);
    Task<(EnclosureResponseDto? Data, string? ErrorMessage)> CreateEnclosureAsync(CreateEnclosureDto dto);
    Task<(EnclosureResponseDto? Data, bool NotFound, string? ErrorMessage)> UpdateEnclosureAsync(int id, UpdateEnclosureDto dto);
    Task<(bool Success, bool NotFound, bool HasConflict, string? Message)> DeleteEnclosureAsync(int id);
    Task<(bool Success, string? Message)> MoveAnimalAsync(MoveAnimalDto dto);
}
