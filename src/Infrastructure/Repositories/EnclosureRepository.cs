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

    public async Task<List<Enclosure>> GetAllAsync()
    {
        return await _context.Enclosures
            .Include(e => e.Area)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Enclosure?> GetByIdAsync(int enclosureId)
    {
        return await _context.Enclosures
            .Include(e => e.Area)
            .FirstOrDefaultAsync(e => e.EnclosureId == enclosureId);
    }

    public async Task<List<Enclosure>> GetByAreaIdAsync(int areaId)
    {
        return await _context.Enclosures
            .Include(e => e.Area)
            .Where(e => e.AreaId == areaId)
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
}
