using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface INarrationService
{
    Task<IEnumerable<NarrationResponseDto>> GetAllAsync(NarrationFilterDto? filter = null);
    Task<NarrationResponseDto?> GetByIdAsync(int id);
    Task<NarrationResponseDto?> GetByAnimalAndLanguageAsync(int animalId, string languageCode);
    Task<NarrationResponseDto> CreateAsync(CreateNarrationDto dto);
    Task<NarrationResponseDto?> UpdateAsync(int id, UpdateNarrationDto dto);
    Task<bool> UpdateStatusAsync(int id, string status);
    Task<bool> DeleteAsync(int id);
    Task<AudioResponseDto?> AddAudioAsync(int narrationId, string fileUrl, string fileName, string mimeType, int? durationSeconds, long? fileSize);
    Task<IEnumerable<LanguageDto>> GetLanguagesAsync();
}
