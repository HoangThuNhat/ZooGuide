using System;
using System.Collections.Generic;

namespace ZooGuide.Application.DTOs;

public class DashboardStatsDto
{
    // --- SECTION A: OPERATIONAL METRICS & TICKET BUYER STATS ---
    /// <summary>
    /// Số người mua vé đang hoạt động (phiên hoạt động gần đây của khách đã mua vé thành công, chưa hết timeout)
    /// </summary>
    public int ActiveTicketBuyers { get; set; }

    /// <summary>
    /// Số người/tài khoản duy nhất đã mua vé thành công trong cơ sở dữ liệu
    /// </summary>
    public int TotalTicketBuyers { get; set; }

    /// <summary>
    /// Tổng số vé đã bán thực tế từ các đơn hàng đã thanh toán thành công
    /// </summary>
    public int TotalTicketsSold { get; set; }

    /// <summary>
    /// Tổng số thiết bị/phiên kết nối đang hoạt động của người mua vé
    /// </summary>
    public int ActiveBuyerConnections { get; set; }

    /// <summary>
    /// Giữ tương thích ngược cho các client cũ (đồng bộ với ActiveTicketBuyers)
    /// </summary>
    public int OnlineUsers { get; set; }

    /// <summary>
    /// Số thiết bị/phiên trình duyệt đang hoạt động (gồm cả người chưa mua và đã mua vé)
    /// </summary>
    public int ActiveDevices { get; set; }

    public int ActiveDevices5Min { get; set; }
    public int TotalTrackedDevices { get; set; }
    public int ActiveSessions { get; set; }
    public int TotalTickets { get; set; }
    public int ActiveTickets { get; set; }
    public int ExpiredTickets { get; set; }
    public int TotalAnimals { get; set; }
    public int TotalSpecies { get; set; }
    public int TotalAreas { get; set; }
    public int TotalEnclosures { get; set; }

    // --- SECTION B: POI & NARRATION HEALTH ---
    public int TotalPois { get; set; }
    public int ActivePois { get; set; }
    public int VerifiedPois { get; set; }
    public int UnverifiedPois { get; set; }
    public int PoisWithNarration { get; set; }
    public int PoisMissingNarration { get; set; }
    public int PoisMissingAudio { get; set; }

    public int TotalNarrations { get; set; }
    public int TotalAudios { get; set; }
    public List<DashboardLanguageStatDto> LanguageStats { get; set; } = new();

    // --- SECTION C: RECENT OPERATIONAL ACTIVITIES ---
    public List<DashboardActivityDto> RecentActivities { get; set; } = new();

    // --- SECTION D: VETERINARY HEALTH LOGS ---
    public List<DashboardHealthLogDto> RecentHealthLogs { get; set; } = new();
}

public class DashboardLanguageStatDto
{
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public int AnimalNarrationsCount { get; set; }
    public int PoiNarrationsCount { get; set; }
    public int AudioFilesCount { get; set; }
}

public class DashboardHealthLogDto
{
    public int Id { get; set; }
    public string AnimalCode { get; set; } = string.Empty;
    public string AnimalName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Veterinarian { get; set; } = string.Empty;
    public string HealthStatus { get; set; } = string.Empty;
    public decimal WeightKg { get; set; }
    public decimal TemperatureC { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string ActionRequired { get; set; } = string.Empty;
}

public class DashboardActivityDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class OnlineUsersSummaryDto
{
    public int ActiveTicketBuyers { get; set; }
    public int ActiveDevices { get; set; }
    public int ActiveBuyerConnections { get; set; }
    public int TotalTicketBuyers { get; set; }
    public int TotalTicketsSold { get; set; }
    public int OnlineUsers { get; set; }
    public int ActiveConnections { get; set; }
    public DateTime CalculatedAtUtc { get; set; } = DateTime.UtcNow;
}
