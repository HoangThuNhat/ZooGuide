using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs.Species;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class SpeciesService : ISpeciesService
{
    private readonly ZooGuideDbContext _context;

    public SpeciesService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SpeciesDto>> GetAllAsync(string? search = null, string? conservationStatus = null, string? lang = null)
    {
        var normalizedLang = TranslationService.NormalizeLanguageCode(lang);
        var query = _context.Species.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            var matchingTranslatedSpeciesIds = await _context.ContentTranslations
                .Where(ct => ct.EntityType == "Species" && ct.IsPublished &&
                             ((ct.Title != null && ct.Title.ToLower().Contains(s)) ||
                              (ct.Description != null && ct.Description.ToLower().Contains(s))))
                .Select(ct => ct.EntityId)
                .Distinct()
                .ToListAsync();

            var matchingEnglishScientifics = LocalizationHelper
                .FindMatchingEnglishSpeciesScientificNames(s)
                .Select(sc => sc.ToLowerInvariant())
                .ToList();

            query = query.Where(x =>
                x.Name.ToLower().Contains(s) ||
                (x.ScientificName != null && x.ScientificName.ToLower().Contains(s)) ||
                (x.Description != null && x.Description.ToLower().Contains(s)) ||
                matchingTranslatedSpeciesIds.Contains(x.SpeciesId) ||
                (x.ScientificName != null && matchingEnglishScientifics.Contains(x.ScientificName.ToLower())));
        }

        if (!string.IsNullOrWhiteSpace(conservationStatus) && conservationStatus != "all")
        {
            var cs = conservationStatus.Trim().ToLower();
            query = query.Where(x => x.ConservationStatus != null && x.ConservationStatus.ToLower().Contains(cs));
        }

        var speciesList = await query.OrderBy(s => s.SpeciesId).ToListAsync();
        var translations = await _context.ContentTranslations
            .Where(ct => ct.EntityType == "Species" && ct.LanguageCode.ToLower() == normalizedLang && ct.IsPublished)
            .AsNoTracking()
            .ToDictionaryAsync(ct => ct.EntityId, ct => ct);

        return speciesList.Select(s => MapToDto(s, normalizedLang, translations.TryGetValue(s.SpeciesId, out var tr) ? tr : null));
    }

    public async Task<SpeciesDto?> GetByIdAsync(int id, string? lang = null)
    {
        var normalizedLang = TranslationService.NormalizeLanguageCode(lang);
        var s = await _context.Species.FindAsync(id);
        if (s == null) return null;

        var tr = await _context.ContentTranslations
            .AsNoTracking()
            .FirstOrDefaultAsync(ct => ct.EntityType == "Species" && ct.EntityId == id && ct.LanguageCode.ToLower() == normalizedLang && ct.IsPublished);

        return MapToDto(s, normalizedLang, tr);
    }

    private static SpeciesDto MapToDto(Species s, string lang, ContentTranslation? tr)
    {
        bool isDefaultVi = lang == "vi";
        bool hasValidDbTr = LocalizationHelper.HasValidDbTranslation(tr?.Title, s.Name, lang);
        EnglishSpeciesContent? enSpec = null;
        bool hasEnCatalog = lang == "en" && LocalizationHelper.TryGetEnglishSpecies(s.ScientificName, out enSpec);
        bool hasTr = isDefaultVi || hasValidDbTr || hasEnCatalog;

        string? habitat = isDefaultVi ? s.Habitat : (hasEnCatalog ? enSpec!.Habitat : null);
        string? diet = isDefaultVi ? s.Diet : (hasEnCatalog ? enSpec!.Diet : null);
        string? lifespan = isDefaultVi ? s.Lifespan : (hasEnCatalog ? enSpec!.Lifespan : null);
        string? conservationStatus = hasEnCatalog
            ? enSpec!.ConservationStatus
            : LocalizationHelper.LocalizeConservationStatus(s.ConservationStatus, lang);

        if (tr != null && !string.IsNullOrWhiteSpace(tr.ExtraJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(tr.ExtraJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("habitat", out var h) && h.ValueKind == JsonValueKind.String &&
                    !LocalizationHelper.IsUntranslatedVietnamese(h.GetString(), s.Habitat, lang))
                    habitat = h.GetString();
                if (root.TryGetProperty("diet", out var d) && d.ValueKind == JsonValueKind.String &&
                    !LocalizationHelper.IsUntranslatedVietnamese(d.GetString(), s.Diet, lang))
                    diet = d.GetString();
                if (root.TryGetProperty("lifespan", out var l) && l.ValueKind == JsonValueKind.String &&
                    !LocalizationHelper.IsUntranslatedVietnamese(l.GetString(), s.Lifespan, lang))
                    lifespan = l.GetString();
                if (root.TryGetProperty("conservationStatus", out var cs) && cs.ValueKind == JsonValueKind.String &&
                    !string.IsNullOrWhiteSpace(cs.GetString()) &&
                    !LocalizationHelper.IsUntranslatedVietnamese(cs.GetString(), s.ConservationStatus, lang))
                    conservationStatus = cs.GetString();
            }
            catch
            {
                // Ignore invalid extra json
            }
        }

        string displayName = isDefaultVi
            ? s.Name
            : (hasValidDbTr ? tr!.Title! : (hasEnCatalog ? enSpec!.Name : s.Name));

        string? displayDescription = isDefaultVi
            ? s.Description
            : (hasValidDbTr && !string.IsNullOrWhiteSpace(tr?.Description) && !LocalizationHelper.IsUntranslatedVietnamese(tr.Description, s.Description, lang)
                ? tr.Description
                : (hasEnCatalog ? enSpec!.Description : null));

        return new SpeciesDto
        {
            SpeciesId = s.SpeciesId,
            OriginalName = s.Name,
            Name = displayName,
            ScientificName = s.ScientificName,
            Description = displayDescription,
            ConservationStatus = conservationStatus,
            ImageUrl = s.ImageUrl,
            Habitat = habitat,
            Diet = diet,
            Lifespan = lifespan,
            ReferenceSource = tr?.SourceReference ?? s.ReferenceSource,
            LanguageCode = lang,
            HasTranslation = hasTr,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };
    }

    public async Task<SpeciesDto> CreateAsync(SpeciesCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required");

        var exists = await _context.Species.AnyAsync(s => s.Name == request.Name);
        if (exists)
            throw new InvalidOperationException("Species name already exists");

        var species = new Species
        {
            Name = request.Name,
            ScientificName = request.ScientificName,
            Description = request.Description,
            ConservationStatus = request.ConservationStatus,
            ImageUrl = request.ImageUrl,
            Habitat = request.Habitat,
            Diet = request.Diet,
            Lifespan = request.Lifespan,
            ReferenceSource = request.ReferenceSource,
            CreatedAt = DateTime.UtcNow
        };

        _context.Species.Add(species);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(species.SpeciesId) ?? throw new Exception("Failed to retrieve created species");
    }

    public async Task<SpeciesDto?> UpdateAsync(int id, SpeciesUpdateRequest request)
    {
        var species = await _context.Species.FindAsync(id);
        if (species == null) return null;

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required");

        if (species.Name != request.Name)
        {
            var exists = await _context.Species.AnyAsync(s => s.Name == request.Name);
            if (exists)
                throw new InvalidOperationException("Species name already exists");
        }

        species.Name = request.Name;
        species.ScientificName = request.ScientificName;
        species.Description = request.Description;
        species.ConservationStatus = request.ConservationStatus;
        species.ImageUrl = request.ImageUrl;
        species.Habitat = request.Habitat ?? species.Habitat;
        species.Diet = request.Diet ?? species.Diet;
        species.Lifespan = request.Lifespan ?? species.Lifespan;
        species.ReferenceSource = request.ReferenceSource ?? species.ReferenceSource;
        species.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(species.SpeciesId);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var species = await _context.Species.Include(s => s.Animals).FirstOrDefaultAsync(s => s.SpeciesId == id);
        if (species == null) return false;

        if (species.Animals.Any())
        {
            throw new InvalidOperationException("Cannot delete species that has associated animals.");
        }

        _context.Species.Remove(species);
        await _context.SaveChangesAsync();
        return true;
    }
}
