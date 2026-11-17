using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class PoiService : IPoiService
{
    private readonly ZooGuideDbContext _context;
    private readonly ISupabaseStorageService _storageService;

    public PoiService(ZooGuideDbContext context, ISupabaseStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<IEnumerable<PoiDto>> GetAllAsync(PoiFilterDto? filter = null)
    {
        var query = _context.PointsOfInterest
            .Include(p => p.Area)
            .Include(p => p.Creator)
            .Include(p => p.Narrations)
                .ThenInclude(n => n.Language)
            .AsNoTracking()
            .AsQueryable();

        if (filter != null)
        {
            if (!string.IsNullOrWhiteSpace(filter.Category) && !filter.Category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cat = filter.Category.Trim();
                query = query.Where(p => p.Category.ToLower() == cat.ToLower());
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(p => p.IsActive == filter.IsActive.Value);
            }

            if (filter.IsVerified.HasValue)
            {
                query = query.Where(p => p.IsCoordinateVerified == filter.IsVerified.Value);
            }

            if (filter.AreaId.HasValue)
            {
                query = query.Where(p => p.AreaId == filter.AreaId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.Trim().ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(s) ||
                                         p.Code.ToLower().Contains(s) ||
                                         (p.Description != null && p.Description.ToLower().Contains(s)));
            }
        }

        var list = await query
            .OrderBy(p => p.Category)
            .ThenBy(p => p.Name)
            .ToListAsync();

        return list.Select(MapToDto);
    }

    public async Task<PoiDto?> GetByIdAsync(int id)
    {
        var poi = await _context.PointsOfInterest
            .Include(p => p.Area)
            .Include(p => p.Creator)
            .Include(p => p.Narrations)
                .ThenInclude(n => n.Language)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PoiId == id);

        return poi == null ? null : MapToDto(poi);
    }

    public async Task<PoiDto?> GetByCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;

        var normalizedCode = code.Trim().ToUpper();
        var poi = await _context.PointsOfInterest
            .Include(p => p.Area)
            .Include(p => p.Creator)
            .Include(p => p.Narrations)
                .ThenInclude(n => n.Language)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code.ToUpper() == normalizedCode);

        return poi == null ? null : MapToDto(poi);
    }

    public async Task<PoiDto> CreateAsync(CreatePoiDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên điểm tham quan không được để trống.");

        var code = string.IsNullOrWhiteSpace(dto.Code)
            ? $"POI-{Guid.NewGuid().ToString()[..6].ToUpper()}"
            : dto.Code.Trim().ToUpper();

        var existingCode = await _context.PointsOfInterest
            .AnyAsync(p => p.Code.ToUpper() == code);

        if (existingCode)
        {
            throw new InvalidOperationException($"Mã điểm tham quan '{code}' đã tồn tại.");
        }

        int creatorId = dto.CreatedBy ?? (await _context.Users.Select(u => u.UserId).FirstOrDefaultAsync());
        if (creatorId == 0) creatorId = 1;

        var poi = new PointOfInterest
        {
            Code = code,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Landmark" : dto.Category.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            RadiusMeters = dto.RadiusMeters,
            IsActive = dto.IsActive,
            IsCoordinateVerified = dto.IsCoordinateVerified,
            VerificationSource = dto.VerificationSource?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            AreaId = dto.AreaId,
            CreatedBy = creatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.PointsOfInterest.Add(poi);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(poi.PoiId))!;
    }

    public async Task<PoiDto?> UpdateAsync(int id, UpdatePoiDto dto)
    {
        var poi = await _context.PointsOfInterest.FindAsync(id);
        if (poi == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.Name))
            poi.Name = dto.Name.Trim();

        if (dto.Description != null)
            poi.Description = dto.Description.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Category))
            poi.Category = dto.Category.Trim();

        if (dto.Latitude.HasValue)
            poi.Latitude = dto.Latitude.Value;

        if (dto.Longitude.HasValue)
            poi.Longitude = dto.Longitude.Value;

        if (dto.IsActive.HasValue)
            poi.IsActive = dto.IsActive.Value;

        if (dto.IsCoordinateVerified.HasValue)
            poi.IsCoordinateVerified = dto.IsCoordinateVerified.Value;

        if (dto.VerificationSource != null)
            poi.VerificationSource = dto.VerificationSource.Trim();

        if (dto.ImageUrl != null)
            poi.ImageUrl = dto.ImageUrl.Trim();

        if (dto.AreaId.HasValue)
            poi.AreaId = dto.AreaId.Value > 0 ? dto.AreaId.Value : null;

        if (dto.RadiusMeters.HasValue)
            poi.RadiusMeters = dto.RadiusMeters.Value;

        poi.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> UpdateStatusAsync(int id, bool isActive)
    {
        var poi = await _context.PointsOfInterest.FindAsync(id);
        if (poi == null) return false;

        poi.IsActive = isActive;
        poi.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> VerifyCoordinatesAsync(int id, bool isVerified, string? verificationSource)
    {
        var poi = await _context.PointsOfInterest.FindAsync(id);
        if (poi == null) return false;

        poi.IsCoordinateVerified = isVerified;
        if (!string.IsNullOrWhiteSpace(verificationSource))
        {
            poi.VerificationSource = verificationSource.Trim();
        }
        poi.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var poi = await _context.PointsOfInterest
            .Include(p => p.Narrations)
            .FirstOrDefaultAsync(p => p.PoiId == id);

        if (poi == null) return false;

        _context.PoiNarrations.RemoveRange(poi.Narrations);
        _context.PointsOfInterest.Remove(poi);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<PoiNarrationDto>> GetNarrationsAsync(int poiId)
    {
        var narrations = await _context.PoiNarrations
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Where(n => n.PoiId == poiId)
            .OrderBy(n => n.Language.Code)
            .AsNoTracking()
            .ToListAsync();

        return narrations.Select(MapNarrationToDto);
    }

    public async Task<PoiNarrationDto?> GetNarrationByIdAsync(int narrationId)
    {
        var n = await _context.PoiNarrations
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.PoiNarrationId == narrationId);

        return n == null ? null : MapNarrationToDto(n);
    }

    public async Task<PoiNarrationDto> AddNarrationAsync(int poiId, CreatePoiNarrationDto dto)
    {
        var poi = await _context.PointsOfInterest.FindAsync(poiId);
        if (poi == null)
            throw new ArgumentException($"Không tìm thấy điểm tham quan ID = {poiId}");

        var lang = await _context.Languages.FindAsync(dto.LanguageId);
        if (lang == null)
            throw new ArgumentException($"Không tìm thấy ngôn ngữ ID = {dto.LanguageId}");

        var existing = await _context.PoiNarrations
            .AnyAsync(n => n.PoiId == poiId && n.LanguageId == dto.LanguageId);

        if (existing)
        {
            throw new InvalidOperationException($"Bài thuyết minh cho điểm '{poi.Name}' với ngôn ngữ '{lang.Name}' đã tồn tại.");
        }

        int creatorId = dto.CreatedBy ?? (await _context.Users.Select(u => u.UserId).FirstOrDefaultAsync());
        if (creatorId == 0) creatorId = 1;

        if (!Enum.TryParse<NarrationStatus>(dto.Status, true, out var statusEnum))
        {
            statusEnum = NarrationStatus.Published;
        }

        var narration = new PoiNarration
        {
            PoiId = poiId,
            LanguageId = dto.LanguageId,
            Title = dto.Title.Trim(),
            Content = dto.Content.Trim(),
            AudioUrl = dto.AudioUrl?.Trim(),
            DurationSeconds = dto.DurationSeconds,
            Status = statusEnum,
            ReferenceSource = dto.ReferenceSource?.Trim(),
            CreatedBy = creatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.PoiNarrations.Add(narration);
        await _context.SaveChangesAsync();

        return (await GetNarrationByIdAsync(narration.PoiNarrationId))!;
    }

    public async Task<PoiNarrationDto?> UpdateNarrationAsync(int narrationId, UpdatePoiNarrationDto dto)
    {
        var narration = await _context.PoiNarrations.FindAsync(narrationId);
        if (narration == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.Title))
            narration.Title = dto.Title.Trim();

        if (dto.Content != null)
            narration.Content = dto.Content.Trim();

        if (dto.AudioUrl != null)
            narration.AudioUrl = dto.AudioUrl.Trim();

        if (dto.DurationSeconds.HasValue)
            narration.DurationSeconds = dto.DurationSeconds.Value;

        if (dto.ReferenceSource != null)
            narration.ReferenceSource = dto.ReferenceSource.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<NarrationStatus>(dto.Status, true, out var statusEnum))
        {
            narration.Status = statusEnum;
        }

        narration.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetNarrationByIdAsync(narrationId);
    }

    public async Task<bool> DeleteNarrationAsync(int narrationId)
    {
        var narration = await _context.PoiNarrations.FindAsync(narrationId);
        if (narration == null) return false;

        _context.PoiNarrations.Remove(narration);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PoiNarrationDto?> UploadNarrationAudioAsync(
        int narrationId, 
        Stream audioStream, 
        string fileName, 
        string contentType)
    {
        var narration = await _context.PoiNarrations
            .Include(n => n.Language)
            .FirstOrDefaultAsync(n => n.PoiNarrationId == narrationId);

        if (narration == null) return null;

        var langCode = narration.Language?.Code ?? "vi";
        var safeFileName = Path.GetFileName(fileName);
        var objectPath = $"poi/{narration.PoiId}/{langCode}_{safeFileName}";

        var uploadResult = await _storageService.UploadAudioAsync(audioStream, objectPath, contentType);

        narration.AudioUrl = !string.IsNullOrWhiteSpace(uploadResult.PublicUrl)
            ? uploadResult.PublicUrl
            : uploadResult.FileUrl;
        narration.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetNarrationByIdAsync(narrationId);
    }

    public async Task<PoiPublicNarrationDto?> GetPublicNarrationAsync(int poiId, string languageCode)
    {
        var poi = await _context.PointsOfInterest
            .Include(p => p.Narrations)
                .ThenInclude(n => n.Language)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PoiId == poiId && p.IsActive);

        if (poi == null) return null;

        var targetCode = (languageCode ?? "vi").Trim().ToLowerInvariant();

        // 1. Exact language match (ưu tiên bản đã Published có file âm thanh)
        var narration = poi.Narrations
            .FirstOrDefault(n => n.Language.Code.ToLowerInvariant() == targetCode && n.Status == NarrationStatus.Published && !string.IsNullOrWhiteSpace(n.AudioUrl));

        bool isFallback = false;
        string? fallbackMessage = null;

        // 2. Fallback to Vietnamese ('vi')
        if (narration == null && targetCode != "vi")
        {
            narration = poi.Narrations
                .OrderByDescending(n => !string.IsNullOrWhiteSpace(n.AudioUrl))
                .FirstOrDefault(n => n.Language.Code.ToLowerInvariant() == "vi" && n.Status == NarrationStatus.Published);
            if (narration != null)
            {
                isFallback = true;
                fallbackMessage = $"Bài thuyết minh hiện chưa hỗ trợ ngôn ngữ {targetCode.ToUpper()}, đang phát bản Tiếng Việt.";
            }
        }

        // 3. Fallback to English ('en')
        if (narration == null && targetCode != "en")
        {
            narration = poi.Narrations
                .OrderByDescending(n => !string.IsNullOrWhiteSpace(n.AudioUrl))
                .FirstOrDefault(n => n.Language.Code.ToLowerInvariant() == "en" && n.Status == NarrationStatus.Published);
            if (narration != null)
            {
                isFallback = true;
                fallbackMessage = $"English narration provided as fallback.";
            }
        }

        // 4. Exact language match without audio (text-only published narration)
        if (narration == null)
        {
            narration = poi.Narrations
                .FirstOrDefault(n => n.Language.Code.ToLowerInvariant() == targetCode && n.Status == NarrationStatus.Published);
        }

        // 5. Any published narration
        if (narration == null)
        {
            narration = poi.Narrations
                .OrderByDescending(n => !string.IsNullOrWhiteSpace(n.AudioUrl))
                .FirstOrDefault(n => n.Status == NarrationStatus.Published);
            if (narration != null)
            {
                isFallback = true;
                fallbackMessage = $"Bản thuyết minh ngôn ngữ {narration.Language?.Name ?? narration.Language?.Code}.";
            }
        }

        if (narration == null)
        {
            // Return POI basic details without audio
            return new PoiPublicNarrationDto
            {
                PoiId = poi.PoiId,
                PoiName = poi.Name,
                Category = poi.Category,
                Latitude = poi.Latitude,
                Longitude = poi.Longitude,
                LanguageCode = targetCode,
                LanguageName = targetCode.ToUpper(),
                Title = poi.Name,
                Content = poi.Description ?? "Chưa có bài thuyết minh cho địa điểm này.",
                AudioUrl = null,
                DurationSeconds = null,
                HasAudio = false,
                IsFallbackLanguage = false,
                FallbackMessage = null
            };
        }

        return new PoiPublicNarrationDto
        {
            PoiId = poi.PoiId,
            PoiName = poi.Name,
            Category = poi.Category,
            Latitude = poi.Latitude,
            Longitude = poi.Longitude,
            LanguageCode = narration.Language?.Code ?? targetCode,
            LanguageName = narration.Language?.Name ?? targetCode.ToUpper(),
            Title = narration.Title,
            Content = narration.Content,
            AudioUrl = narration.AudioUrl,
            DurationSeconds = narration.DurationSeconds,
            HasAudio = !string.IsNullOrWhiteSpace(narration.AudioUrl),
            IsFallbackLanguage = isFallback,
            FallbackMessage = fallbackMessage
        };
    }

    private static PoiDto MapToDto(PointOfInterest p)
    {
        var narrations = p.Narrations?.Select(MapNarrationToDto).ToList() ?? new List<PoiNarrationDto>();
        return new PoiDto
        {
            PoiId = p.PoiId,
            Code = p.Code,
            Name = p.Name,
            Description = p.Description,
            Category = p.Category,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            RadiusMeters = p.RadiusMeters,
            IsActive = p.IsActive,
            IsCoordinateVerified = p.IsCoordinateVerified,
            VerificationSource = p.VerificationSource,
            ImageUrl = p.ImageUrl,
            AreaId = p.AreaId,
            AreaName = p.Area?.Name,
            CreatedBy = p.CreatedBy,
            CreatorName = p.Creator?.FullName ?? p.Creator?.Username,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            NarrationCount = narrations.Count,
            HasAudio = narrations.Any(n => string.Equals(n.Status, "Published", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(n.AudioUrl)),
            Narrations = narrations
        };
    }

    private static PoiNarrationDto MapNarrationToDto(PoiNarration n)
    {
        return new PoiNarrationDto
        {
            PoiNarrationId = n.PoiNarrationId,
            PoiId = n.PoiId,
            LanguageId = n.LanguageId,
            LanguageCode = n.Language?.Code ?? string.Empty,
            LanguageName = n.Language?.Name ?? string.Empty,
            Title = n.Title,
            Content = n.Content,
            AudioUrl = n.AudioUrl,
            DurationSeconds = n.DurationSeconds,
            Status = n.Status.ToString(),
            ReferenceSource = n.ReferenceSource,
            CreatedBy = n.CreatedBy,
            CreatorName = n.Creator?.FullName ?? n.Creator?.Username,
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt
        };
    }
}
