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

    public async Task<IEnumerable<SpeciesDto>> GetAllAsync(string? search = null, string? conservationStatus = null)
    {
        var query = _context.Species.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(s) || 
                                    (x.ScientificName != null && x.ScientificName.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(conservationStatus) && conservationStatus != "all")
        {
            var cs = conservationStatus.Trim().ToLower();
            query = query.Where(x => x.ConservationStatus != null && x.ConservationStatus.ToLower().Contains(cs));
        }

        return await query
            .Select(s => new SpeciesDto
            {
                SpeciesId = s.SpeciesId,
                Name = s.Name,
                ScientificName = s.ScientificName,
                Description = s.Description,
                ConservationStatus = s.ConservationStatus,
                ImageUrl = s.ImageUrl,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<SpeciesDto?> GetByIdAsync(int id)
    {
        var s = await _context.Species.FindAsync(id);
        if (s == null) return null;

        return new SpeciesDto
        {
            SpeciesId = s.SpeciesId,
            Name = s.Name,
            ScientificName = s.ScientificName,
            Description = s.Description,
            ConservationStatus = s.ConservationStatus,
            ImageUrl = s.ImageUrl,
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
