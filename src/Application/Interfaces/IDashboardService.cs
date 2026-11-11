using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(DateTime? fromDate = null, DateTime? toDate = null);
    Task<DashboardHealthLogDto?> RecordHealthCheckAsync(UpdateAnimalHealthDto dto);
    Task<TelemetryEventDto> RecordTelemetryEventAsync(RecordTelemetryEventRequest request);
    Task<DashboardAudioVerificationSummaryDto> VerifyAudioStorageAsync(bool forceRefresh = false);
    Task<bool> UpdateAlertStatusAsync(UpdateAlertStatusRequest request);
}
