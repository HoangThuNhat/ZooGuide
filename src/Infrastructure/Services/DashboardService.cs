using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ZooGuideDbContext _context;
    private readonly IOnlineUserTracker? _onlineTracker;

    public DashboardService(ZooGuideDbContext context, IOnlineUserTracker? onlineTracker = null)
    {
        _context = context;
        _onlineTracker = onlineTracker;
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

        // 1. Truthful active-device monitoring (last 5 minutes)
        var cutoff5Min = now.AddMinutes(-5);
        var deviceStats = await _context.DeviceActivities
            .AsNoTracking()
            .GroupBy(d => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Active5Min = g.Count(d => d.LastSeenAt >= cutoff5Min)
            })
            .FirstOrDefaultAsync();

        var totalTrackedDevices = deviceStats?.Total ?? 0;
        var activeDevices5Min = deviceStats?.Active5Min ?? 0;

        // 2. Dữ liệu vé và giao dịch thanh toán thành công theo bộ lọc thời gian
        var paidOrdersQuery = _context.TicketOrders
            .AsNoTracking()
            .Where(o => o.PaymentStatus == PaymentStatus.Paid);

        var ticketQuery = _context.Tickets.AsQueryable();
        if (utcFrom.HasValue)
        {
            ticketQuery = ticketQuery.Where(t => t.IssuedAt >= utcFrom.Value || t.CreatedAt >= utcFrom.Value);
            paidOrdersQuery = paidOrdersQuery.Where(o => (o.PaidAt ?? o.CreatedAt) >= utcFrom.Value);
        }
        if (utcTo.HasValue)
        {
            ticketQuery = ticketQuery.Where(t => t.IssuedAt <= utcTo.Value && t.CreatedAt <= utcTo.Value);
            paidOrdersQuery = paidOrdersQuery.Where(o => (o.PaidAt ?? o.CreatedAt) <= utcTo.Value);
        }

        // Thống kê người mua vé và vé đã bán thực tế
        var totalTicketBuyers = await paidOrdersQuery
            .Where(o => !string.IsNullOrEmpty(o.CustomerEmail))
            .Select(o => o.CustomerEmail.ToLower().Trim())
            .Distinct()
            .CountAsync();

        var totalTicketsSold = await paidOrdersQuery
            .SumAsync(o => (int?)o.Quantity) ?? 0;

        var activeTicketBuyers = _onlineTracker?.GetActiveTicketBuyersCount() ?? 0;
        var activeDevices = _onlineTracker?.GetActiveDevicesCount() ?? activeDevices5Min;
        var activeBuyerConnections = _onlineTracker?.GetActiveBuyerConnectionsCount() ?? 0;

        var totalTickets = await ticketQuery.CountAsync();
        var activeTickets = await ticketQuery.CountAsync(t => t.Status == TicketStatus.Valid || t.Status == TicketStatus.Used);
        var expiredTickets = await ticketQuery.CountAsync(t => t.Status == TicketStatus.Expired || (t.ValidUntil < now && t.Status != TicketStatus.Cancelled));

        // 3. Current Inventory Metrics (không phụ thuộc bộ lọc lịch sử)
        var totalAnimals = await _context.Animals.CountAsync();
        var totalSpecies = await _context.Species.CountAsync();
        var totalAreas = await _context.Areas.CountAsync();
        var totalEnclosures = await _context.Enclosures.CountAsync();
        var totalNarrations = await _context.Narrations.CountAsync();
        var totalAudios = await _context.Audios.CountAsync();

        // 4. POI & Narration Health Metrics (Single aggregated query)
        var poiSummary = await _context.PointsOfInterest
            .AsNoTracking()
            .Select(p => new
            {
                p.IsActive,
                p.IsCoordinateVerified,
                HasPublishedNarration = p.Narrations.Any(n => n.Status == NarrationStatus.Published),
                HasAudio = p.Narrations.Any(n => n.Status == NarrationStatus.Published && !string.IsNullOrEmpty(n.AudioUrl))
            })
            .ToListAsync();

        var totalPois = poiSummary.Count;
        var activePois = poiSummary.Count(p => p.IsActive);
        var verifiedPois = poiSummary.Count(p => p.IsCoordinateVerified);
        var unverifiedPois = totalPois - verifiedPois;
        var poisWithNarration = poiSummary.Count(p => p.HasPublishedNarration);
        var poisMissingNarration = totalPois - poisWithNarration;
        var poisMissingAudio = poiSummary.Count(p => !p.HasAudio);

        // 5. Language Breakdown for Narrations and Audios
        var languages = await _context.Languages
            .Where(l => l.IsActive)
            .OrderBy(l => l.Code)
            .Select(l => new
            {
                l.LanguageId,
                l.Code,
                l.Name
            })
            .ToListAsync();

        var animalNarrByLang = await _context.Narrations
            .Where(n => n.Status == NarrationStatus.Published)
            .GroupBy(n => n.LanguageId)
            .Select(g => new { LanguageId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.LanguageId, g => g.Count);

        var poiNarrByLang = await _context.PoiNarrations
            .Where(n => n.Status == NarrationStatus.Published)
            .GroupBy(n => n.LanguageId)
            .Select(g => new { LanguageId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.LanguageId, g => g.Count);

        var audiosByLang = await _context.Audios
            .Where(a => a.Status == AudioStatus.Active && a.LanguageCode != null)
            .GroupBy(a => a.LanguageCode!.ToLower())
            .Select(g => new { LanguageCode = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.LanguageCode, g => g.Count);

        var languageStats = languages.Select(l => new DashboardLanguageStatDto
        {
            LanguageCode = l.Code,
            LanguageName = l.Name,
            AnimalNarrationsCount = animalNarrByLang.TryGetValue(l.LanguageId, out var anc) ? anc : 0,
            PoiNarrationsCount = poiNarrByLang.TryGetValue(l.LanguageId, out var pnc) ? pnc : 0,
            AudioFilesCount = audiosByLang.TryGetValue(l.Code.ToLower(), out var ac) ? ac : 0
        }).ToList();

        // 6. Phiên khách tham quan trong kỳ
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

        // 7. Lấy danh sách kiểm tra sức khỏe
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

        // 8. Lấy các hoạt động thực tế gần đây (Tickets, Animals, POIs, Narrations)
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

        var recentPois = await _context.PointsOfInterest
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Take(2)
            .Select(p => new DashboardActivityDto
            {
                Title = $"Điểm tham quan {p.Name} ({p.Code})",
                Description = $"Phân loại: {p.Category}, tọa độ {(p.IsCoordinateVerified ? "đã xác thực" : "chưa xác thực")}",
                Type = "POI",
                Timestamp = p.UpdatedAt ?? p.CreatedAt
            })
            .ToListAsync();

        var activities = recentTickets.Concat(recentAnimals).Concat(recentPois)
            .OrderByDescending(a => a.Timestamp)
            .Take(8)
            .ToList();

        return new DashboardStatsDto
        {
            ActiveTicketBuyers = activeTicketBuyers,
            ActiveDevices = activeDevices,
            TotalTicketBuyers = totalTicketBuyers,
            TotalTicketsSold = totalTicketsSold,
            ActiveBuyerConnections = activeBuyerConnections,
            OnlineUsers = activeTicketBuyers,
            ActiveDevices5Min = activeDevices5Min,
            TotalTrackedDevices = totalTrackedDevices,
            ActiveSessions = activeSessions,
            TotalTickets = totalTickets,
            ActiveTickets = activeTickets,
            ExpiredTickets = expiredTickets,
            TotalAnimals = totalAnimals,
            TotalSpecies = totalSpecies,
            TotalAreas = totalAreas,
            TotalEnclosures = totalEnclosures,
            TotalPois = totalPois,
            ActivePois = activePois,
            VerifiedPois = verifiedPois,
            UnverifiedPois = unverifiedPois,
            PoisWithNarration = poisWithNarration,
            PoisMissingNarration = poisMissingNarration,
            PoisMissingAudio = poisMissingAudio,
            TotalNarrations = totalNarrations,
            TotalAudios = totalAudios,
            LanguageStats = languageStats,
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
