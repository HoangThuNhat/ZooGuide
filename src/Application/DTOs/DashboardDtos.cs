namespace ZooGuide.Application.DTOs;

public class DashboardStatsDto
{
    public int TotalTickets { get; set; }
    public int ActiveTickets { get; set; }
    public int ExpiredTickets { get; set; }
    public int TotalAnimals { get; set; }
    public int TotalSpecies { get; set; }
    public int TotalAreas { get; set; }
    public int TotalNarrations { get; set; }
    public int TotalAudios { get; set; }
    public int ActiveSessions { get; set; }
    public List<DashboardHealthLogDto> RecentHealthLogs { get; set; } = new();
    public List<DashboardActivityDto> RecentActivities { get; set; } = new();
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
