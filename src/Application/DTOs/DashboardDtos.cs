using System;
using System.Collections.Generic;

namespace ZooGuide.Application.DTOs;

public class DashboardStatsDto
{
    // --- LEGACY & BACKWARD-COMPATIBLE METRICS (Preserved for existing tests & modules) ---
    public int ActiveTicketBuyers { get; set; }
    public int TotalTicketBuyers { get; set; }
    public int TotalTicketsSold { get; set; }
    public int ActiveBuyerConnections { get; set; }
    public int OnlineUsers { get; set; }
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
    public List<DashboardActivityDto> RecentActivities { get; set; } = new();
    public List<DashboardHealthLogDto> RecentHealthLogs { get; set; } = new();

    // --- NEW MULTILINGUAL AUTOMATED NARRATION DASHBOARD SECTIONS (TASKS 1 - 9) ---
    public DashboardOverviewKpisDto OverviewKpis { get; set; } = new();
    public DashboardPoiMonitoringDto PoiMonitoring { get; set; } = new();
    public DashboardContentAudioMonitoringDto ContentAudioMonitoring { get; set; } = new();
    public DashboardNarrationActivityDto NarrationActivity { get; set; } = new();
    public DashboardGpsTriggerDto GpsAutoTrigger { get; set; } = new();
    public DashboardLanguageUsageDto LanguageUsage { get; set; } = new();
    public List<DashboardPoiInterestRankDto> PoiRanking { get; set; } = new();
    public DashboardServiceMonitoringDto ServiceMonitoring { get; set; } = new();
    public List<DashboardOperationLogDto> ActivityLogs { get; set; } = new();
    public List<DashboardSystemAlertDto> SystemAlerts { get; set; } = new();
}

// ============================================================================
// TASK 2: 8 OVERVIEW KPI CARDS
// ============================================================================
public class DashboardOverviewKpisDto
{
    // 1. Khách đang sử dụng thuyết minh
    public int ActiveNarrationUsersCount { get; set; }
    public int ActiveTelemetryUsers15Min { get; set; }
    public int ActiveDevices5Min { get; set; }
    public int ActiveTicketSessionsCount { get; set; }
    public string ActiveUsersFormulaNote { get; set; } = string.Empty;

    // 2. Tổng lượt phát âm thanh
    public int TotalAudioPlayRequests { get; set; }
    public int TotalAudioPlayStarted { get; set; }
    public int TotalAudioPlayCompleted { get; set; }
    public int TotalAudioPlayStoppedEarly { get; set; }
    public int HistoricalVisitPlaysCount { get; set; }

    // 3. Số ngôn ngữ có nội dung thuyết minh khả dụng
    public int AvailableLanguagesCount { get; set; }
    public int TotalSupportedLanguagesCount { get; set; }
    public int LanguagesWithPoiNarrationCount { get; set; }
    public int LanguagesWithFullCoverageCount { get; set; }

    // 4. Số POI đủ điều kiện kích hoạt thuyết minh
    public int ReadyPoisCount { get; set; }
    public int TotalPoisCount { get; set; }
    public int ActivePoisCount { get; set; }
    public int FullyMultilingualPoisCount { get; set; }

    // 5. Tỷ lệ phát âm thanh thành công
    public double? AudioPlaySuccessRatePercent { get; set; }
    public double? StrictCompletionRatePercent { get; set; }
    public int SuccessfulPlayOutcomesCount { get; set; }
    public int ValidPlayOutcomesCount { get; set; }
    public bool HasPlayRateData { get; set; }

    // 6. Số lượt phát âm thanh thất bại
    public int FailedAudioPlaysCount { get; set; }
    public int FileLoadErrorCount { get; set; }
    public int ApiErrorCount { get; set; }
    public int PlaybackErrorCount { get; set; }

    // 7. Số bài thuyết minh đã xuất bản
    public int PublishedNarrationsCount { get; set; }
    public int PublishedAnimalNarrationsCount { get; set; }
    public int PublishedPoiNarrationsCount { get; set; }
    public int UnpublishedNarrationsCount { get; set; }
    public int ExpectedTotalNarrationsCount { get; set; }

    // 8. Tỷ lệ phiên tham quan có GPS khả dụng
    public double? GpsAvailableSessionRatePercent { get; set; }
    public int SessionsWithValidGpsCount { get; set; }
    public int TotalEvaluatedSessionsCount { get; set; }
    public int GpsUnavailableEventsCount { get; set; }
    public bool HasGpsSessionData { get; set; }
}

// ============================================================================
// TASK 3: POI MONITORING
// ============================================================================
public class DashboardPoiMonitoringDto
{
    public int TotalPois { get; set; }
    public int ActivePois { get; set; }
    public int InactivePois { get; set; }
    public int ValidCoordinatePois { get; set; }
    public int InvalidOrMissingCoordinatePois { get; set; }
    public int ConfiguredRadiusPois { get; set; }
    public int MissingRadiusPois { get; set; }
    public int PoisWithNarration { get; set; }
    public int PoisMissingNarration { get; set; }
    public int PoisWithValidAudio { get; set; }
    public int PoisMissingValidAudio { get; set; }
    public int ReadyForAutoTriggerCount { get; set; }
    public int NotReadyForAutoTriggerCount { get; set; }
    public int PoisMissingMultilingualCount { get; set; }
    public List<DashboardPoiReadinessItemDto> PoiItems { get; set; } = new();
}

public class DashboardPoiReadinessItemDto
{
    public int PoiId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal RadiusMeters { get; set; }
    public bool IsActive { get; set; }
    public bool IsCoordinateVerified { get; set; }
    public bool HasValidCoordinates { get; set; }
    public bool HasConfiguredRadius { get; set; }
    public bool HasPublishedNarration { get; set; }
    public bool HasValidAudio { get; set; }
    public int PublishedLanguagesCount { get; set; }
    public int TotalSupportedLanguagesCount { get; set; }
    public int ValidAudioCount { get; set; }
    public List<string> PublishedLanguageCodes { get; set; } = new();
    public List<string> MissingLanguageCodes { get; set; } = new();
    public bool IsReadyForAutoTrigger { get; set; }
    public bool IsFullyMultilingual { get; set; }
    public string ReadinessStatus { get; set; } = string.Empty;
    public List<string> IssuesAndReasons { get; set; } = new();
    public string ManageUrl { get; set; } = "/admin/pois";
}

// ============================================================================
// TASK 4: CONTENT & AUDIO FILE MONITORING
// ============================================================================
public class DashboardContentAudioMonitoringDto
{
    public int TotalAnimalNarrations { get; set; }
    public int ExpectedAnimalNarrations { get; set; }
    public int TotalPoiNarrations { get; set; }
    public int ExpectedPoiNarrations { get; set; }
    public int PublishedNarrationsCount { get; set; }
    public int UnpublishedNarrationsCount { get; set; }
    public int MissingAnimalTranslationsCount { get; set; }
    public int MissingPoiTranslationsCount { get; set; }
    public int MissingNarrationTranslationsCount { get; set; }
    public int MissingEntityTranslationsCount { get; set; }
    public int NarrationsMissingAudioCount { get; set; }

    // 4-Stage Audio Verification
    public int TotalAudioEntriesChecked { get; set; }
    public int Stage1HasValidUrlCount { get; set; }
    public int InvalidAudioUrlCount { get; set; }
    public int Stage2FileExistsCount { get; set; }
    public int MissingAudioFileCount { get; set; }
    public int Stage3FileDownloadableCount { get; set; }
    public int InaccessibleAudioFileCount { get; set; }
    public int Stage4FilePlayableCount { get; set; }
    public int UnplayableAudioFileCount { get; set; }

    public string StorageBucket { get; set; } = "narration-audio";
    public string SupabaseStorageUrl { get; set; } = string.Empty;
    public int LocalMirrorFilesCount { get; set; }
    public DateTime LastVerifiedAtUtc { get; set; } = DateTime.UtcNow;
    public string VerificationCacheNote { get; set; } = string.Empty;

    public List<DashboardContentIssueDto> ContentIssues { get; set; } = new();
}

public class DashboardContentIssueDto
{
    public string IssueId { get; set; } = string.Empty;
    public string IssueType { get; set; } = string.Empty; // MissingTranslation, MissingAudio, InvalidAudioUrl, InaccessibleAudio, UnplayableAudio, Unpublished
    public string Severity { get; set; } = "Warning"; // Critical, Warning, Information
    public string EntityType { get; set; } = string.Empty; // Animal, POI, Enclosure
    public int EntityId { get; set; }
    public string EntityCode { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ManageUrl { get; set; } = "/admin/narration";
}

public class DashboardAudioVerificationSummaryDto
{
    public DateTime VerifiedAtUtc { get; set; } = DateTime.UtcNow;
    public int TotalChecked { get; set; }
    public int Stage1HasValidUrlCount { get; set; }
    public int Stage2FileExistsCount { get; set; }
    public int Stage3FileDownloadableCount { get; set; }
    public int Stage4FilePlayableCount { get; set; }
    public int InvalidUrlCount { get; set; }
    public int InaccessibleCount { get; set; }
    public int UnplayableCount { get; set; }
    public List<DashboardAudioCheckItemDto> Items { get; set; } = new();
}

public class DashboardAudioCheckItemDto
{
    public string SourceType { get; set; } = string.Empty; // AnimalNarration, PoiNarration
    public int RecordId { get; set; }
    public string TargetName { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public string AudioUrl { get; set; } = string.Empty;
    public bool HasValidUrl { get; set; }
    public bool FileExists { get; set; }
    public bool IsDownloadable { get; set; }
    public bool IsPlayable { get; set; }
    public long SizeBytes { get; set; }
    public string FormatInfo { get; set; } = string.Empty;
    public string? ErrorReason { get; set; }
}

// ============================================================================
// TASK 5: MULTILINGUAL COVERAGE TABLE
// ============================================================================
public class DashboardLanguageStatDto
{
    public int LanguageId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public string NativeName { get; set; } = string.Empty;
    public string FlagIcon { get; set; } = string.Empty;

    public int AnimalNarrationsCount { get; set; }
    public int TotalActiveAnimals { get; set; }
    public int PoiNarrationsCount { get; set; }
    public int TotalActivePois { get; set; }

    public int CompleteNarrationsCount { get; set; }
    public int ExpectedNarrationsCount { get; set; }
    public int MissingNarrationsCount { get; set; }

    public int AudioFilesCount { get; set; }
    public int ValidAudioFilesCount { get; set; }
    public int AnimalAudioCount { get; set; }
    public int PoiAudioCount { get; set; }

    public int EntityTranslationsCount { get; set; }
    public int ExpectedEntityTranslationsCount { get; set; }
    public int MissingEntityTranslationsCount { get; set; }

    public double CompletionRatePercent { get; set; }
    public double AnimalCompletionRatePercent { get; set; }
    public double PoiCompletionRatePercent { get; set; }
    public string DenominatorFormula { get; set; } = "36 mục thuyết minh (22 Động vật + 14 POI)";
    public string AvailabilityStatus { get; set; } = string.Empty;

    public List<string> MissingAnimalNames { get; set; } = new();
    public List<string> MissingPoiNames { get; set; } = new();
}

// ============================================================================
// TASK 6: NARRATION ACTIVITY ANALYTICS
// ============================================================================
public class DashboardNarrationActivityDto
{
    public int TotalPlayRequests { get; set; }
    public int TotalPlayStarted { get; set; }
    public int TotalPlayCompleted { get; set; }
    public int TotalPlayStoppedEarly { get; set; }
    public int TotalPlayFailed { get; set; }
    public int ErrorLoadFileCount { get; set; }
    public int ErrorApiCount { get; set; }
    public int ErrorPlaybackCount { get; set; }
    public double? SuccessRatePercent { get; set; }
    public bool HasActivityData { get; set; }
    public string PeakUsagePeriod { get; set; } = "Chưa có dữ liệu";
    public int PeakUsageRequestsCount { get; set; }
    public double AverageListenDurationSeconds { get; set; }
    public List<DashboardNarrationTimeSlotDto> TimeSeries { get; set; } = new();
}

public class DashboardNarrationTimeSlotDto
{
    public string Label { get; set; } = string.Empty;
    public DateTime PeriodStartUtc { get; set; }
    public int PlayRequests { get; set; }
    public int PlayStarted { get; set; }
    public int PlayCompleted { get; set; }
    public int PlayStoppedEarly { get; set; }
    public int PlayFailed { get; set; }
    public double? SuccessRatePercent { get; set; }
}

// ============================================================================
// TASK 7: GPS AUTO-TRIGGER EFFECTIVENESS
// ============================================================================
public class DashboardGpsTriggerDto
{
    public int ProximityDetectedCount { get; set; }
    public int EligibleForTriggerCount { get; set; }
    public int TriggeredCount { get; set; }
    public int PlaySuccessAfterTriggerCount { get; set; }
    public int TriggerFailedCount { get; set; }
    public int GpsUnavailableCount { get; set; }
    public int SkippedCooldownCount { get; set; }
    public int DuplicatePreventedCount { get; set; }

    public double? ProximityToEligibleRatePercent { get; set; }
    public double? EligibleToTriggeredRatePercent { get; set; }
    public double? TriggeredToSuccessRatePercent { get; set; }
    public double? OverallConversionRatePercent { get; set; }
    public bool HasGpsTriggerData { get; set; }

    public List<DashboardPoiGpsEffectivenessDto> PoiTriggerStats { get; set; } = new();
}

public class DashboardPoiGpsEffectivenessDto
{
    public int PoiId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal RadiusMeters { get; set; }
    public int ProximityCount { get; set; }
    public int EligibleCount { get; set; }
    public int TriggeredCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCooldownCount { get; set; }
    public int DuplicatePreventedCount { get; set; }
    public double? ConversionRatePercent { get; set; }
}

// ============================================================================
// TASK 8: VISITOR LANGUAGE USAGE & POI INTEREST RANKING
// ============================================================================
public class DashboardLanguageUsageDto
{
    public int TotalUsageEvents { get; set; }
    public string MostUsedLanguageCode { get; set; } = string.Empty;
    public string MostUsedLanguageName { get; set; } = "Chưa có dữ liệu";
    public double? MostUsedSharePercent { get; set; }
    public bool HasUsageData { get; set; }
    public List<DashboardVisitorLanguageUsageItemDto> Items { get; set; } = new();
}

public class DashboardVisitorLanguageUsageItemDto
{
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public string NativeName { get; set; } = string.Empty;
    public string FlagIcon { get; set; } = string.Empty;
    public int SelectionEventsCount { get; set; }
    public int AudioPlayRequestsCount { get; set; }
    public int HistoricalVisitsCount { get; set; }
    public int TotalUsageCount { get; set; }
    public double SharePercent { get; set; }
    public string TrendNote { get; set; } = string.Empty;
}

public class DashboardPoiInterestRankDto
{
    public int Rank { get; set; }
    public int PoiId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int GpsTriggersCount { get; set; }
    public int PlayRequestsCount { get; set; }
    public int PlaySuccessCount { get; set; }
    public int PlayFailedCount { get; set; }
    public double? SuccessRatePercent { get; set; }
    public double AverageListenDurationSeconds { get; set; }
    public int TotalInteractionsCount { get; set; }
    public string ManageUrl { get; set; } = "/admin/pois";
}

// ============================================================================
// TASK 9: SERVICE MONITORING, ACTIVITY LOGS & ALERTS
// ============================================================================
public class DashboardServiceMonitoringDto
{
    public string OverallStatus { get; set; } = "Healthy";
    public DateTime CheckedAtUtc { get; set; } = DateTime.UtcNow;
    public List<DashboardServiceStatusItemDto> Services { get; set; } = new();
}

public class DashboardServiceStatusItemDto
{
    public string ServiceKey { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = "Healthy"; // Healthy, Degraded, Down
    public long ResponseTimeMs { get; set; }
    public DateTime LastCheckedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastErrorAtUtc { get; set; }
    public string? LastErrorMessage { get; set; }
    public DateTime? LastRecoveredAtUtc { get; set; }
    public string Details { get; set; } = string.Empty;
}

public class DashboardOperationLogDto
{
    public string LogId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Category { get; set; } = string.Empty; // ADMIN, AUDIO, GPS, LANGUAGE, SYSTEM
    public string EventType { get; set; } = string.Empty;
    public string EventLabel { get; set; } = string.Empty;
    public string ActorOrSession { get; set; } = string.Empty;
    public string TargetEntity { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
    public string TargetName { get; set; } = string.Empty;
    public string ResultStatus { get; set; } = "Success"; // Success, Failed, Skipped, Warning
    public string Details { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public class DashboardSystemAlertDto
{
    public string AlertKey { get; set; } = string.Empty;
    public string AlertType { get; set; } = string.Empty; // MissingAudio, InaccessibleAudio, MissingTranslation, PoiCoordinate, GpsUnavailable, TriggerFailed, ServiceHealth
    public string Severity { get; set; } = "Warning"; // Critical, Warning, Information
    public string Status { get; set; } = "Unresolved"; // Unresolved (Chưa xử lý), InProgress (Đang xử lý), Resolved (Đã khắc phục)
    public string StatusLabel { get; set; } = "Chưa xử lý";
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DetectedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public string TargetEntity { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = "/admin";
}

// ============================================================================
// TELEMETRY & ALERT REQUEST / RESPONSE DTOS
// ============================================================================
public class RecordTelemetryEventRequest
{
    public string Category { get; set; } = "AUDIO"; // AUDIO, GPS, LANGUAGE, SYSTEM
    public string EventType { get; set; } = string.Empty;
    public string? InstallationId { get; set; }
    public Guid? SessionId { get; set; }
    public string? LanguageCode { get; set; }
    public string? TargetType { get; set; } // POI, Animal, Species, Area
    public int? TargetId { get; set; }
    public string? TargetCode { get; set; }
    public string? TargetName { get; set; }
    public string? TriggerSource { get; set; } // GPS_AUTO, MANUAL_MAP, MANUAL_LIST, QR_SCAN
    public int? ListenDurationSeconds { get; set; }
    public int? TotalDurationSeconds { get; set; }
    public decimal? DistanceMeters { get; set; }
    public decimal? AccuracyMeters { get; set; }
    public bool IsSuccess { get; set; } = true;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
}

public class TelemetryEventDto
{
    public long TelemetryEventId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateAlertStatusRequest
{
    public string AlertKey { get; set; } = string.Empty;
    public string Status { get; set; } = "InProgress"; // Unresolved, InProgress, Resolved
    public string? Note { get; set; }
}

// ============================================================================
// LEGACY DTOS
// ============================================================================
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
    public int ActiveTicketBuyerDevices { get; set; }
    public DateTime CalculatedAtUtc { get; set; } = DateTime.UtcNow;
}
