using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs.TicketType;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class TicketTypeService : ITicketTypeService
{
    private readonly ZooGuideDbContext _context;

    public TicketTypeService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TicketTypeDto>> GetAllAsync()
    {
        return await _context.TicketTypes
            .Select(tt => new TicketTypeDto
            {
                TicketTypeId = tt.TicketTypeId,
                Name = tt.Name,
                Description = tt.Description,
                Price = tt.Price,
                DurationMinutes = tt.DurationMinutes,
                IsActive = tt.IsActive,
                CreatedAt = tt.CreatedAt,
                UpdatedAt = tt.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<TicketTypeDto?> GetByIdAsync(int id)
    {
        var tt = await _context.TicketTypes.FindAsync(id);
        if (tt == null) return null;

        return new TicketTypeDto
        {
            TicketTypeId = tt.TicketTypeId,
            Name = tt.Name,
            Description = tt.Description,
            Price = tt.Price,
            DurationMinutes = tt.DurationMinutes,
            IsActive = tt.IsActive,
            CreatedAt = tt.CreatedAt,
            UpdatedAt = tt.UpdatedAt
        };
    }

    public async Task<TicketTypeDto> CreateAsync(TicketTypeCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required");

        if (request.Price < 0)
            throw new ArgumentException("Price cannot be negative");

        if (request.DurationMinutes <= 0)
            throw new ArgumentException("Duration must be positive");

        var exists = await _context.TicketTypes.AnyAsync(tt => tt.Name == request.Name);
        if (exists)
            throw new InvalidOperationException("Ticket Type name already exists");

        var ticketType = new TicketType
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            DurationMinutes = request.DurationMinutes,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketTypes.Add(ticketType);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(ticketType.TicketTypeId) ?? throw new Exception("Failed to retrieve created ticket type");
    }

    public async Task<TicketTypeDto?> UpdateAsync(int id, TicketTypeUpdateRequest request)
    {
        var ticketType = await _context.TicketTypes.FindAsync(id);
        if (ticketType == null) return null;

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required");

        if (request.Price < 0)
            throw new ArgumentException("Price cannot be negative");

        if (request.DurationMinutes <= 0)
            throw new ArgumentException("Duration must be positive");

        if (ticketType.Name != request.Name)
        {
            var exists = await _context.TicketTypes.AnyAsync(tt => tt.Name == request.Name);
            if (exists)
                throw new InvalidOperationException("Ticket Type name already exists");
        }

        ticketType.Name = request.Name;
        ticketType.Description = request.Description;
        ticketType.Price = request.Price;
        ticketType.DurationMinutes = request.DurationMinutes;
        ticketType.IsActive = request.IsActive;
        ticketType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(ticketType.TicketTypeId);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ticketType = await _context.TicketTypes.Include(tt => tt.Tickets).FirstOrDefaultAsync(tt => tt.TicketTypeId == id);
        if (ticketType == null) return false;

        if (ticketType.Tickets.Any())
        {
            // Soft delete
            ticketType.IsActive = false;
            ticketType.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("Cannot hard delete ticket type because it has associated tickets. Deactivated instead.");
        }

        _context.TicketTypes.Remove(ticketType);
        await _context.SaveChangesAsync();
        return true;
    }
}
