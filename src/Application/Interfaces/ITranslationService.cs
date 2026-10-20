using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface ITranslationService
{
    Task<Dictionary<string, string>> GetUiTranslationsAsync(string languageCode);
    Task<IEnumerable<ContentTranslationDto>> GetTranslationsAsync(string? languageCode = null, string? entityType = null, int? entityId = null);
    Task<ContentTranslationDto> UpsertTranslationAsync(UpsertContentTranslationDto dto);
}
