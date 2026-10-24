using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IPoiService
{
    Task<IEnumerable<PoiDto>> GetAllAsync(PoiFilterDto? filter = null);
    Task<PoiDto?> GetByIdAsync(int id);
    Task<PoiDto?> GetByCodeAsync(string code);
    Task<PoiDto> CreateAsync(CreatePoiDto dto);
    Task<PoiDto?> UpdateAsync(int id, UpdatePoiDto dto);
    Task<bool> UpdateStatusAsync(int id, bool isActive);
    Task<bool> VerifyCoordinatesAsync(int id, bool isVerified, string? verificationSource);
    Task<bool> DeleteAsync(int id);

    // Multilingual Narration
    Task<IEnumerable<PoiNarrationDto>> GetNarrationsAsync(int poiId);
    Task<PoiNarrationDto?> GetNarrationByIdAsync(int narrationId);
    Task<PoiNarrationDto> AddNarrationAsync(int poiId, CreatePoiNarrationDto dto);
    Task<PoiNarrationDto?> UpdateNarrationAsync(int narrationId, UpdatePoiNarrationDto dto);
    Task<bool> DeleteNarrationAsync(int narrationId);
    Task<PoiNarrationDto?> UploadNarrationAudioAsync(int narrationId, Stream audioStream, string fileName, string contentType);

    // Public Visitor Narration with Language Fallback
    Task<PoiPublicNarrationDto?> GetPublicNarrationAsync(int poiId, string languageCode);
}
