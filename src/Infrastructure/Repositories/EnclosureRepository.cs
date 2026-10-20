using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Repositories;

public class EnclosureRepository : IEnclosureRepository
{
    private readonly ZooGuideDbContext _context;

    public EnclosureRepository(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<List<Enclosure>> GetAllAsync(int? areaId = null, string? search = null, string? status = null)
    {
        var query = _context.Enclosures
            .Include(e => e.Area)
            .Include(e => e.Animals)
                .ThenInclude(a => a.Species)
            .AsNoTracking()
            .AsQueryable();

        if (areaId.HasValue && areaId.Value > 0)
        {
            query = query.Where(e => e.AreaId == areaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            var matchingEnclosureIds = await _context.ContentTranslations
                .Where(ct => ct.EntityType == "Enclosure" && ct.IsPublished &&
                             ((ct.Title != null && ct.Title.ToLower().Contains(s)) ||
                              (ct.Description != null && ct.Description.ToLower().Contains(s))))
                .Select(ct => ct.EntityId)
                .Distinct()
                .ToListAsync();

            var matchingAreaIds = await _context.ContentTranslations
                .Where(ct => ct.EntityType == "Area" && ct.IsPublished &&
                             (ct.Title != null && ct.Title.ToLower().Contains(s)))
                .Select(ct => ct.EntityId)
                .Distinct()
                .ToListAsync();

            query = query.Where(e =>
                e.Name.ToLower().Contains(s) ||
                (e.Code != null && e.Code.ToLower().Contains(s)) ||
                (e.Description != null && e.Description.ToLower().Contains(s)) ||
                (e.Area != null && e.Area.Name.ToLower().Contains(s)) ||
                matchingEnclosureIds.Contains(e.EnclosureId) ||
                matchingAreaIds.Contains(e.AreaId));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            var st = status.Trim().ToLower();
            query = query.Where(e => e.Status.ToLower() == st);
        }

        return await query.OrderBy(e => e.AreaId).ThenBy(e => e.EnclosureId).ToListAsync();
    }

    public async Task<Enclosure?> GetByIdAsync(int enclosureId)
    {
        return await _context.Enclosures
            .Include(e => e.Area)
            .FirstOrDefaultAsync(e => e.EnclosureId == enclosureId);
    }

    public async Task<Enclosure?> GetByIdWithDetailsAsync(int enclosureId)
    {
        return await _context.Enclosures
            .Include(e => e.Area)
            .Include(e => e.Animals)
                .ThenInclude(a => a.Species)
            .FirstOrDefaultAsync(e => e.EnclosureId == enclosureId);
    }

    public async Task<Enclosure?> GetByCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var c = code.Trim().ToLower();
        return await _context.Enclosures.FirstOrDefaultAsync(e => e.Code != null && e.Code.ToLower() == c);
    }

    public async Task<List<Enclosure>> GetByAreaIdAsync(int areaId)
    {
        return await _context.Enclosures
            .Include(e => e.Area)
            .Include(e => e.Animals)
                .ThenInclude(a => a.Species)
            .Where(e => e.AreaId == areaId)
            .OrderBy(e => e.EnclosureId)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Enclosure> CreateAsync(Enclosure enclosure)
    {
        _context.Enclosures.Add(enclosure);
        await _context.SaveChangesAsync();
        return enclosure;
    }

    public async Task UpdateAsync(Enclosure enclosure)
    {
        _context.Enclosures.Update(enclosure);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Enclosure enclosure)
    {
        _context.Enclosures.Remove(enclosure);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasAnimalsAsync(int enclosureId)
    {
        return await _context.Animals.AnyAsync(a => a.EnclosureId == enclosureId);
    }

    public async Task<List<ContentTranslation>> GetTranslationsByLanguageAsync(string languageCode)
    {
        var lang = (languageCode ?? "vi").Trim().ToLowerInvariant();
        if (lang == "zh-cn" || lang == "zh_cn" || lang == "zh-hans") lang = "zh";
        return await _context.ContentTranslations
            .Where(ct => ct.LanguageCode.ToLower() == lang && ct.IsPublished)
            .AsNoTracking()
            .ToListAsync();
    }
}
