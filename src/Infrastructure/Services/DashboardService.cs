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

    public async Task<DashboardStatsDto> GetStatsAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var now = DateTime.UtcNow;

        DateTime? utcFrom = fromDate.HasValue
            ? (fromDate.Value.Kind == DateTimeKind.Utc ? fromDate.Value : DateTime.SpecifyKind(fromDate.Value, DateTimeKind.Utc))
            : null;

        DateTime? utcTo = toDate.HasValue
            ? (toDate.Value.Kind == DateTimeKind.Utc ? toDate.Value : DateTime.SpecifyKind(toDate.Value, DateTimeKind.Utc))
            : null;

        if (utcTo.HasValue && utcTo.Value.TimeOfDay == TimeSpan.Zero)
        {
            utcTo = utcTo.Value.Date.AddDays(1).AddTicks(-1);
        }

        // 1. Dữ liệu vé (có trường ngày phát hành IssuedAt / CreatedAt -> chịu ảnh hưởng của bộ lọc thời gian)
        var ticketQuery = _context.Tickets.AsQueryable();
        if (utcFrom.HasValue)
        {
            ticketQuery = ticketQuery.Where(t => t.IssuedAt >= utcFrom.Value || t.CreatedAt >= utcFrom.Value);
        }
        if (utcTo.HasValue)
        {
            ticketQuery = ticketQuery.Where(t => t.IssuedAt <= utcTo.Value && t.CreatedAt <= utcTo.Value);
        }

        var totalTickets = await ticketQuery.CountAsync();
        var activeTickets = await ticketQuery.CountAsync(t => t.Status == TicketStatus.Valid || t.Status == TicketStatus.Used);
        var expiredTickets = await ticketQuery.CountAsync(t => t.Status == TicketStatus.Expired || (t.ValidUntil < now && t.Status != TicketStatus.Cancelled));

        // 2. Chỉ số tổng tích lũy không phụ thuộc thời gian (Động vật, Loài sinh thái, Khu chuồng trại, Thuyết minh, Audio)
        var totalAnimals = await _context.Animals.CountAsync();
        var totalSpecies = await _context.Species.CountAsync();
        var totalAreas = await _context.Areas.CountAsync();
        var totalNarrations = await _context.Narrations.CountAsync();
        var totalAudios = await _context.Audios.CountAsync();

        // 3. Phiên khách tham quan (StartedAt trong kỳ)
        var sessionQuery = _context.TicketSessions.AsQueryable();
        if (utcFrom.HasValue)
        {
            sessionQuery = sessionQuery.Where(s => s.StartedAt >= utcFrom.Value);
        }
        if (utcTo.HasValue)
        {
            sessionQuery = sessionQuery.Where(s => s.StartedAt <= utcTo.Value);
        }

        var activeSessions = await sessionQuery.CountAsync(s => s.Status == SessionStatus.Active && (s.ExpiredAt > now || !utcFrom.HasValue));

        // 4. Lấy danh sách kiểm tra sức khỏe từ các cá thể động vật thực tế theo thời gian cập nhật
        var animalQuery = _context.Animals
            .Include(a => a.Species)
            .AsQueryable();

        if (utcFrom.HasValue)
        {
            animalQuery = animalQuery.Where(a => (a.UpdatedAt ?? a.CreatedAt) >= utcFrom.Value);
        }
        if (utcTo.HasValue)
        {
            animalQuery = animalQuery.Where(a => (a.UpdatedAt ?? a.CreatedAt) <= utcTo.Value);
        }

        var animals = await animalQuery
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .Take(10)
            .ToListAsync();

        var healthLogs = animals.Select(a => new DashboardHealthLogDto
        {
            Id = a.AnimalId,
            AnimalCode = $"ANI-{a.AnimalId:D3}",
            AnimalName = a.Name,
            Date = (a.LastHealthCheckAt ?? a.UpdatedAt ?? a.CreatedAt).ToString("yyyy-MM-dd"),
            Veterinarian = string.IsNullOrWhiteSpace(a.VeterinarianName) ? "BS. Thú Y Thảo Cầm Viên" : a.VeterinarianName,
            HealthStatus = string.IsNullOrWhiteSpace(a.HealthStatus) ? "Bình thường" : a.HealthStatus,
            WeightKg = a.WeightKg ?? 0m,
            TemperatureC = a.TemperatureC ?? 0m,
            Notes = string.IsNullOrWhiteSpace(a.ConservationNote) ? (a.Description ?? string.Empty) : a.ConservationNote,
            ActionRequired = !string.IsNullOrWhiteSpace(a.HealthActionRequired)
                ? a.HealthActionRequired
                : (a.Status == AnimalStatus.UnderTreatment ? "Cần theo dõi sát sao phác đồ điều trị" : string.Empty)
        }).ToList();

        // 5. Lấy các hoạt động gần đây trong kỳ
        var recentTickets = await ticketQuery
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

        var recentAnimals = await animalQuery
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
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

    public async Task<DashboardHealthLogDto?> RecordHealthCheckAsync(UpdateAnimalHealthDto dto)
    {
        var animal = await _context.Animals.FindAsync(dto.AnimalId);
        if (animal == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.HealthStatus))
        {
            animal.HealthStatus = dto.HealthStatus.Trim();
            if (dto.HealthStatus.Contains("điều trị", StringComparison.OrdinalIgnoreCase) ||
                dto.HealthStatus.Contains("treatment", StringComparison.OrdinalIgnoreCase))
            {
                animal.Status = AnimalStatus.UnderTreatment;
            }
            else if (animal.Status == AnimalStatus.UnderTreatment)
            {
                animal.Status = AnimalStatus.Active;
            }
        }
        if (dto.WeightKg.HasValue && dto.WeightKg.Value > 0)
            animal.WeightKg = dto.WeightKg.Value;
        if (dto.TemperatureC.HasValue && dto.TemperatureC.Value > 0)
            animal.TemperatureC = dto.TemperatureC.Value;
        if (!string.IsNullOrWhiteSpace(dto.VeterinarianName))
            animal.VeterinarianName = dto.VeterinarianName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Notes))
            animal.ConservationNote = dto.Notes.Trim();
        if (dto.ActionRequired != null)
            animal.HealthActionRequired = dto.ActionRequired.Trim();

        animal.LastHealthCheckAt = DateTime.UtcNow;
        animal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new DashboardHealthLogDto
        {
            Id = animal.AnimalId,
            AnimalCode = $"ANI-{animal.AnimalId:D3}",
            AnimalName = animal.Name,
            Date = (animal.LastHealthCheckAt ?? animal.UpdatedAt ?? animal.CreatedAt).ToString("yyyy-MM-dd"),
            Veterinarian = string.IsNullOrWhiteSpace(animal.VeterinarianName) ? "BS. Thú Y Thảo Cầm Viên" : animal.VeterinarianName,
            HealthStatus = string.IsNullOrWhiteSpace(animal.HealthStatus) ? "Bình thường" : animal.HealthStatus,
            WeightKg = animal.WeightKg ?? 0m,
            TemperatureC = animal.TemperatureC ?? 0m,
            Notes = string.IsNullOrWhiteSpace(animal.ConservationNote) ? (animal.Description ?? string.Empty) : animal.ConservationNote,
            ActionRequired = animal.HealthActionRequired ?? string.Empty
        };
    }
}
