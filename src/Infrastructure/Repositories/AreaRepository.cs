using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Repositories;

public class AreaRepository : IAreaRepository
{
    private readonly ZooGuideDbContext _context;

    public AreaRepository(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<List<Area>> GetAllWithAnimalsAsync()
    {
        return await _context.Areas
            .Include(a => a.Enclosures)
                .ThenInclude(e => e.Animals)
                    .ThenInclude(an => an.Species)
            .Include(a => a.Animals)
                .ThenInclude(an => an.Species)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Area?> GetByIdWithAnimalsAsync(int areaId)
    {
        return await _context.Areas
            .Include(a => a.Enclosures)
                .ThenInclude(e => e.Animals)
                    .ThenInclude(an => an.Species)
            .Include(a => a.Animals)
                .ThenInclude(an => an.Species)
            .FirstOrDefaultAsync(a => a.AreaId == areaId);
    }

    public async Task<Area?> GetByIdAsync(int areaId)
    {
        return await _context.Areas.FindAsync(areaId);
    }

    public async Task<Area?> GetByNameAsync(string name)
    {
        return await _context.Areas
            .FirstOrDefaultAsync(a => a.Name.ToLower() == name.Trim().ToLower());
    }

    public async Task<Area> AddAsync(Area area)
    {
        _context.Areas.Add(area);
        await _context.SaveChangesAsync();
        return area;
    }

    public async Task UpdateAsync(Area area)
    {
        _context.Areas.Update(area);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Area area)
    {
        _context.Areas.Remove(area);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasAnimalsAsync(int areaId)
    {
        return await _context.Animals.AnyAsync(a => a.AreaId == areaId);
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
