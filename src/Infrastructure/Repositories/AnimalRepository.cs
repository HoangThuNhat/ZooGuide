using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Repositories;

public class AnimalRepository : IAnimalRepository
{
    private readonly ZooGuideDbContext _context;

    public AnimalRepository(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<List<Animal>> GetAllWithDetailsAsync(
        string? search, 
        int? areaId, 
        string? zoneId, 
        int? speciesId, 
        string? iucnStatus,
        int? enclosureId = null)
    {
        var query = _context.Animals
            .Include(a => a.Species)
            .Include(a => a.Area)
            .Include(a => a.Enclosure)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a =>
                a.Name.ToLower().Contains(s) ||
                (a.Description != null && a.Description.ToLower().Contains(s)) ||
                a.Species.Name.ToLower().Contains(s) ||
                (a.Species.ScientificName != null && a.Species.ScientificName.ToLower().Contains(s)) ||
                (a.Enclosure != null && a.Enclosure.Name.ToLower().Contains(s)));
        }

        if (areaId.HasValue && areaId.Value > 0)
        {
            query = query.Where(a => a.AreaId == areaId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(zoneId) && zoneId != "all")
        {
            // Hỗ trợ filter theo "zone-a", "zone-b" từ frontend
            var cleanZone = zoneId.Replace("zone-", "").ToUpper();
            if (cleanZone.Length == 1 && char.IsLetter(cleanZone[0]))
            {
                int calculatedAreaId = cleanZone[0] - 'A' + 1;
                query = query.Where(a => a.AreaId == calculatedAreaId);
            }
        }

        if (enclosureId.HasValue)
        {
            if (enclosureId.Value > 0)
            {
                query = query.Where(a => a.EnclosureId == enclosureId.Value);
            }
            else if (enclosureId.Value == 0) // Special case: unassigned animals
            {
                query = query.Where(a => a.EnclosureId == null);
            }
        }

        if (speciesId.HasValue && speciesId.Value > 0)
        {
            query = query.Where(a => a.SpeciesId == speciesId.Value);
        }

        if (!string.IsNullOrWhiteSpace(iucnStatus) && iucnStatus != "all")
        {
            var iucn = iucnStatus.Trim().ToLower();
            query = query.Where(a => a.Species.ConservationStatus != null &&
                                     a.Species.ConservationStatus.ToLower().Contains(iucn));
        }

        return await query.ToListAsync();
    }

    public async Task<Animal?> GetByIdWithDetailsAsync(int animalId)
    {
        return await _context.Animals
            .Include(a => a.Species)
            .Include(a => a.Area)
            .Include(a => a.Enclosure)
            .FirstOrDefaultAsync(a => a.AnimalId == animalId);
    }

    public async Task<Animal?> GetByIdAsync(int animalId)
    {
        return await _context.Animals.FindAsync(animalId);
    }

    public async Task<Animal> AddAsync(Animal animal)
    {
        _context.Animals.Add(animal);
        await _context.SaveChangesAsync();
        return animal;
    }

    public async Task UpdateAsync(Animal animal)
    {
        _context.Animals.Update(animal);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Animal animal)
    {
        _context.Animals.Remove(animal);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasNarrationsAsync(int animalId)
    {
        return await _context.Narrations.AnyAsync(n => n.AnimalId == animalId);
    }

    public async Task<bool> SpeciesExistsAsync(int speciesId)
    {
        return await _context.Species.AnyAsync(s => s.SpeciesId == speciesId);
    }

    public async Task<bool> AreaExistsAsync(int areaId)
    {
        return await _context.Areas.AnyAsync(a => a.AreaId == areaId);
    }

    public async Task<bool> EnclosureExistsAsync(int enclosureId)
    {
        return await _context.Enclosures.AnyAsync(e => e.EnclosureId == enclosureId);
    }
}
