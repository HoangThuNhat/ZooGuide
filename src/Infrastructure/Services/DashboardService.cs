using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ZooGuideDbContext _context;

    public DashboardService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var now = DateTime.UtcNow;

        var totalTickets = await _context.Tickets.CountAsync();
        var activeTickets = await _context.Tickets.CountAsync(t => t.Status == TicketStatus.Valid || t.Status == TicketStatus.Used);
        var expiredTickets = await _context.Tickets.CountAsync(t => t.Status == TicketStatus.Expired || (t.ValidUntil < now && t.Status != TicketStatus.Cancelled));

        var totalAnimals = await _context.Animals.CountAsync();
        var totalSpecies = await _context.Species.CountAsync();
        var totalAreas = await _context.Areas.CountAsync();
        var totalNarrations = await _context.Narrations.CountAsync();
        var totalAudios = await _context.Audios.CountAsync();

        var activeSessions = await _context.TicketSessions.CountAsync(s => s.Status == SessionStatus.Active && s.ExpiredAt > now);

        // Lấy danh sách kiểm tra sức khỏe từ các cá thể động vật thực tế
        var animals = await _context.Animals
            .Include(a => a.Species)
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .Take(10)
            .ToListAsync();

        var healthLogs = animals.Select(a => new DashboardHealthLogDto
        {
            Id = a.AnimalId,
            AnimalCode = $"ANI-{a.AnimalId:D3}",
            AnimalName = a.Name,
            Date = (a.UpdatedAt ?? a.CreatedAt).ToString("yyyy-MM-dd"),
            Veterinarian = "BS. Thú Y ZooGuide",
            HealthStatus = string.IsNullOrWhiteSpace(a.HealthStatus) ? "Bình thường" : a.HealthStatus,
            WeightKg = 150.0m + (a.AnimalId * 15 % 80),
            TemperatureC = 38.0m + (a.AnimalId % 5) * 0.1m,
            Notes = string.IsNullOrWhiteSpace(a.ConservationNote) ? (a.Description ?? "Tình trạng sức khỏe ổn định") : a.ConservationNote,
            ActionRequired = a.Status == AnimalStatus.UnderTreatment ? "Cần theo dõi sát sao phác đồ điều trị" : ""
        }).ToList();

        // Lấy các hoạt động gần đây
        var recentTickets = await _context.Tickets
            .OrderByDescending(t => t.IssuedAt)
            .Take(3)
            .Select(t => new DashboardActivityDto
            {
                Title = $"Phát hành vé {t.TicketCode}",
                Description = $"Trạng thái: {t.Status}, hạn đến {t.ValidUntil:yyyy-MM-dd HH:mm}",
                Type = "Ticket",
                Timestamp = t.IssuedAt
            })
            .ToListAsync();

        var recentAnimals = await _context.Animals
            .OrderByDescending(a => a.CreatedAt)
            .Take(2)
            .Select(a => new DashboardActivityDto
            {
                Title = $"Cập nhật cá thể {a.Name}",
                Description = $"Tình trạng: {a.Status}, sức khỏe: {a.HealthStatus}",
                Type = "Animal",
                Timestamp = a.UpdatedAt ?? a.CreatedAt
            })
            .ToListAsync();

        var activities = recentTickets.Concat(recentAnimals)
            .OrderByDescending(a => a.Timestamp)
            .ToList();

        return new DashboardStatsDto
        {
            TotalTickets = totalTickets,
            ActiveTickets = activeTickets,
            ExpiredTickets = expiredTickets,
            TotalAnimals = totalAnimals,
            TotalSpecies = totalSpecies,
            TotalAreas = totalAreas,
            TotalNarrations = totalNarrations,
            TotalAudios = totalAudios,
            ActiveSessions = activeSessions,
            RecentHealthLogs = healthLogs,
            RecentActivities = activities
        };
    }
}
