using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class TranslationService : ITranslationService
{
    private readonly ZooGuideDbContext _context;

    public TranslationService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<Dictionary<string, string>> GetUiTranslationsAsync(string languageCode)
    {
        var lang = NormalizeLanguageCode(languageCode);
        var rows = await _context.ContentTranslations
            .Where(ct => ct.EntityType == "UI" && ct.LanguageCode.ToLower() == lang && ct.IsPublished)
            .AsNoTracking()
            .ToListAsync();

        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            if (!string.IsNullOrWhiteSpace(row.EntityKey) && row.Title != null)
            {
                dict[row.EntityKey] = row.Title;
            }
        }
        return dict;
    }

    public async Task<IEnumerable<ContentTranslationDto>> GetTranslationsAsync(string? languageCode = null, string? entityType = null, int? entityId = null)
    {
        var query = _context.ContentTranslations.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(languageCode))
        {
            var lang = NormalizeLanguageCode(languageCode);
            query = query.Where(ct => ct.LanguageCode.ToLower() == lang);
        }

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            var et = entityType.Trim();
            query = query.Where(ct => ct.EntityType.ToLower() == et.ToLower());
        }

        if (entityId.HasValue)
        {
            query = query.Where(ct => ct.EntityId == entityId.Value);
        }

        var list = await query
            .OrderBy(ct => ct.EntityType)
            .ThenBy(ct => ct.EntityId)
            .ThenBy(ct => ct.EntityKey)
            .ToListAsync();

        return list.Select(MapToDto);
    }

    public async Task<ContentTranslationDto> UpsertTranslationAsync(UpsertContentTranslationDto dto)
    {
        var lang = NormalizeLanguageCode(dto.LanguageCode);
        var entityType = dto.EntityType.Trim();
        var entityKey = (dto.EntityKey ?? string.Empty).Trim();

        var existing = await _context.ContentTranslations
            .FirstOrDefaultAsync(ct =>
                ct.EntityType == entityType &&
                ct.EntityId == dto.EntityId &&
                ct.EntityKey == entityKey &&
                ct.LanguageCode.ToLower() == lang);

        if (existing == null)
        {
            existing = new ContentTranslation
            {
                EntityType = entityType,
                EntityId = dto.EntityId,
                EntityKey = entityKey,
                LanguageCode = lang,
                Title = dto.Title,
                Summary = dto.Summary,
                Description = dto.Description,
                ExtraJson = dto.ExtraJson,
                TranslationStatus = string.IsNullOrWhiteSpace(dto.TranslationStatus) ? "Published" : dto.TranslationStatus,
                IsPublished = dto.IsPublished,
                SourceReference = dto.SourceReference,
                CreatedAt = DateTime.UtcNow
            };
            _context.ContentTranslations.Add(existing);
        }
        else
        {
            existing.Title = dto.Title;
            existing.Summary = dto.Summary;
            existing.Description = dto.Description;
            existing.ExtraJson = dto.ExtraJson;
            existing.TranslationStatus = string.IsNullOrWhiteSpace(dto.TranslationStatus) ? existing.TranslationStatus : dto.TranslationStatus;
            existing.IsPublished = dto.IsPublished;
            existing.SourceReference = dto.SourceReference ?? existing.SourceReference;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return MapToDto(existing);
    }

    public static string NormalizeLanguageCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return "vi";
        var normalized = code.Trim().ToLowerInvariant();
        if (normalized == "zh-cn" || normalized == "zh_cn" || normalized == "zh-hans")
            return "zh";
        return normalized;
    }

    private static ContentTranslationDto MapToDto(ContentTranslation ct) => new()
    {
        TranslationId = ct.TranslationId,
        EntityType = ct.EntityType,
        EntityId = ct.EntityId,
        EntityKey = ct.EntityKey,
        LanguageCode = ct.LanguageCode,
        Title = ct.Title,
        Summary = ct.Summary,
        Description = ct.Description,
        ExtraJson = ct.ExtraJson,
        TranslationStatus = ct.TranslationStatus,
        IsPublished = ct.IsPublished,
        SourceReference = ct.SourceReference,
        CreatedAt = ct.CreatedAt,
        UpdatedAt = ct.UpdatedAt
    };
}
