using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.Services;

/// <summary>
/// Xử lý nghiệp vụ phân khu sở thú (Areas) và giải thuật điều hướng Geofencing
/// </summary>
public class AreaService : IAreaService
{
    private readonly IAreaRepository _areaRepository;

    public AreaService(IAreaRepository areaRepository)
    {
        _areaRepository = areaRepository;
    }

    public async Task<IEnumerable<AreaResponseDto>> GetAllAreasAsync(string? lang = null)
    {
        var normalizedLang = NormalizeLang(lang);
        var areas = await _areaRepository.GetAllWithAnimalsAsync();
        var translations = await _areaRepository.GetTranslationsByLanguageAsync(normalizedLang);
        return areas.Select(a => MapToResponseDto(a, normalizedLang, translations));
    }

    public async Task<AreaResponseDto?> GetAreaByIdAsync(int areaId, string? lang = null)
    {
        var normalizedLang = NormalizeLang(lang);
        var area = await _areaRepository.GetByIdWithAnimalsAsync(areaId);
        if (area == null) return null;
        var translations = await _areaRepository.GetTranslationsByLanguageAsync(normalizedLang);
        return MapToResponseDto(area, normalizedLang, translations);
    }

    public async Task<AreaResponseDto> CreateAreaAsync(CreateAreaDto dto)
    {
        var existing = await _areaRepository.GetByNameAsync(dto.Name.Trim());
        if (existing != null)
        {
            throw new InvalidOperationException($"Tên khu vực '{dto.Name}' đã tồn tại trong hệ thống.");
        }

        // Khởi tạo entity khu vực mới
        var area = new Area
        {
            Code = string.IsNullOrWhiteSpace(dto.Code) ? null : dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            RadiusMeters = dto.RadiusMeters,
            MapImageUrl = dto.MapImageUrl?.Trim(),
            MapX = dto.MapX,
            MapY = dto.MapY,
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _areaRepository.AddAsync(area);
        return MapToResponseDto(created);
    }

    public async Task<AreaResponseDto?> UpdateAreaAsync(int areaId, UpdateAreaDto dto)
    {
        var area = await _areaRepository.GetByIdWithAnimalsAsync(areaId);
        if (area == null) return null;

        var existing = await _areaRepository.GetByNameAsync(dto.Name.Trim());
        if (existing != null && existing.AreaId != areaId)
        {
            throw new InvalidOperationException($"Tên khu vực '{dto.Name}' đã được sử dụng bởi khu vực khác.");
        }

        // Cập nhật thông tin và tọa độ kiểm định
        if (!string.IsNullOrWhiteSpace(dto.Code))
        {
            area.Code = dto.Code.Trim().ToUpper();
        }
        area.Name = dto.Name.Trim();
        area.Description = dto.Description?.Trim();
        area.Latitude = dto.Latitude;
        area.Longitude = dto.Longitude;
        area.RadiusMeters = dto.RadiusMeters;
        area.MapImageUrl = dto.MapImageUrl?.Trim();
        area.MapX = dto.MapX;
        area.MapY = dto.MapY;
        area.Status = dto.Status;
        area.UpdatedAt = DateTime.UtcNow;

        await _areaRepository.UpdateAsync(area);
        return MapToResponseDto(area);
    }

    public async Task<(bool Success, bool HasConflict, string? Message)> DeleteAreaAsync(int areaId)
    {
        var area = await _areaRepository.GetByIdAsync(areaId);
        if (area == null)
        {
            return (false, false, "Khu vực không tồn tại trong hệ thống.");
        }

        // Kiểm tra ràng buộc dữ liệu động vật
        bool hasAnimals = await _areaRepository.HasAnimalsAsync(areaId);
        if (hasAnimals)
        {
            // Bảo toàn toàn vẹn dữ liệu: Chuyển sang trạng thái Closed (đóng cửa) thay vì xóa cứng
            area.Status = AreaStatus.Closed;
            area.UpdatedAt = DateTime.UtcNow;
            await _areaRepository.UpdateAsync(area);
            return (true, true, "Khu vực đang chứa động vật nên không thể xóa vật lý. Đã chuyển trạng thái sang 'Closed' (Đóng cửa).");
        }

        // Không có ràng buộc -> Xóa an toàn
        await _areaRepository.DeleteAsync(area);
        return (true, false, "Đã xóa khu vực thành công.");
    }

    public async Task<AreaNavigationDto?> GetNavigationToAreaAsync(int areaId, decimal userLat, decimal userLng)
    {
        var targetArea = await _areaRepository.GetByIdAsync(areaId);
        if (targetArea == null) return null;

        // Tính khoảng cách bằng công thức Haversine
        double distanceMeters = CalculateHaversineDistance(
            (double)userLat, (double)userLng, 
            (double)targetArea.Latitude, (double)targetArea.Longitude);

        // Tính góc phương vị di chuyển (bearing)
        double bearingDegrees = CalculateBearing(
            (double)userLat, (double)userLng, 
            (double)targetArea.Latitude, (double)targetArea.Longitude);

        // Xác định hướng la bàn
        string compassDirection = BearingToCompass(bearingDegrees);

        // Kiểm tra du khách đã vào bên trong bán kính geofencing của khu vực chưa
        bool isInside = distanceMeters <= (double)targetArea.RadiusMeters;

        return new AreaNavigationDto
        {
            TargetAreaId = targetArea.AreaId,
            TargetAreaName = targetArea.Name,
            TargetLatitude = targetArea.Latitude,
            TargetLongitude = targetArea.Longitude,
            UserLatitude = userLat,
            UserLongitude = userLng,
            DistanceMeters = Math.Round(distanceMeters, 1),
            BearingDegrees = Math.Round(bearingDegrees, 1),
            DirectionCompass = compassDirection,
            IsInsideArea = isInside
        };
    }

    #region Helper Math & Mapping Methods

    private static string NormalizeLang(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return "vi";
        var c = code.Trim().ToLowerInvariant();
        return (c == "zh-cn" || c == "zh_cn" || c == "zh-hans") ? "zh" : c;
    }

    private static AreaResponseDto MapToResponseDto(Area a, string lang = "vi", List<ContentTranslation>? translations = null)
    {
        bool isDefaultVi = lang == "vi";
        var areaTr = translations?.FirstOrDefault(ct => ct.EntityType == "Area" && ct.EntityId == a.AreaId);
        bool hasAreaTr = isDefaultVi || (areaTr != null && !string.IsNullOrWhiteSpace(areaTr.Title));
        string areaDisplayName = areaTr != null && !string.IsNullOrWhiteSpace(areaTr.Title) ? areaTr.Title : a.Name;
        string? areaDisplayDesc = areaTr != null && !string.IsNullOrWhiteSpace(areaTr.Description) ? areaTr.Description : (hasAreaTr ? a.Description : null);

        string code = !string.IsNullOrWhiteSpace(a.Code) 
            ? a.Code 
            : (a.AreaId > 0 && a.AreaId <= 26 
                ? ((char)('A' + a.AreaId - 1)).ToString() 
                : $"Z{a.AreaId}");

        var enclosures = a.Enclosures?.Select(e =>
        {
            var encTr = translations?.FirstOrDefault(ct => ct.EntityType == "Enclosure" && ct.EntityId == e.EnclosureId);
            bool hasEncTr = isDefaultVi || (encTr != null && !string.IsNullOrWhiteSpace(encTr.Title));
            string encDisplayName = encTr != null && !string.IsNullOrWhiteSpace(encTr.Title) ? encTr.Title : e.Name;
            string? encDisplayDesc = encTr != null && !string.IsNullOrWhiteSpace(encTr.Description) ? encTr.Description : (hasEncTr ? e.Description : null);

            var activeAnimals = e.Animals?.Where(an => an.Status == AnimalStatus.Active || an.Status == AnimalStatus.UnderTreatment).ToList()
                                ?? new List<Animal>();

            return new EnclosureResponse
            {
                EnclosureId = e.EnclosureId,
                AreaId = e.AreaId,
                AreaName = areaDisplayName,
                AreaCode = code,
                Code = e.Code ?? $"ENC-{e.EnclosureId:D3}",
                OriginalName = e.Name,
                Name = encDisplayName,
                Description = encDisplayDesc,
                LanguageCode = lang,
                HasTranslation = hasEncTr,
                ReferenceSource = encTr?.SourceReference ?? e.ReferenceSource,
                ImageUrl = e.ImageUrl,
                Status = e.Status,
                MapX = e.MapX,
                MapY = e.MapY,
                Latitude = e.Latitude,
                Longitude = e.Longitude,
                AnimalCount = activeAnimals.Count,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt,
                Animals = activeAnimals.Select(an =>
                {
                    var anTr = translations?.FirstOrDefault(ct => ct.EntityType == "Animal" && ct.EntityId == an.AnimalId);
                    var spTr = an.Species != null ? translations?.FirstOrDefault(ct => ct.EntityType == "Species" && ct.EntityId == an.SpeciesId) : null;
                    bool hasAnTr = isDefaultVi || (anTr != null && !string.IsNullOrWhiteSpace(anTr.Title));
                    return new AnimalResponseDto
                    {
                        AnimalId = an.AnimalId,
                        SpeciesId = an.SpeciesId,
                        SpeciesName = spTr != null && !string.IsNullOrWhiteSpace(spTr.Title) ? spTr.Title : (an.Species?.Name ?? string.Empty),
                        ScientificName = an.Species?.ScientificName,
                        ConservationStatus = an.Species?.ConservationStatus,
                        AreaId = an.AreaId,
                        AreaName = areaDisplayName,
                        EnclosureId = an.EnclosureId,
                        EnclosureName = encDisplayName,
                        EnclosureCode = e.Code,
                        OriginalName = an.Name,
                        Name = anTr != null && !string.IsNullOrWhiteSpace(anTr.Title) ? anTr.Title : an.Name,
                        Description = anTr != null && !string.IsNullOrWhiteSpace(anTr.Description) ? anTr.Description : (hasAnTr ? an.Description : null),
                        LanguageCode = lang,
                        HasTranslation = hasAnTr,
                        ReferenceSource = anTr?.SourceReference ?? an.ReferenceSource,
                        Gender = an.Gender.ToString(),
                        DateOfBirth = an.DateOfBirth,
                        Origin = an.Origin,
                        HealthStatus = an.HealthStatus,
                        ConservationNote = an.ConservationNote,
                        ImageUrl = an.ImageUrl,
                        WeightKg = an.WeightKg,
                        TemperatureC = an.TemperatureC,
                        VeterinarianName = an.VeterinarianName,
                        HealthActionRequired = an.HealthActionRequired,
                        LastHealthCheckAt = an.LastHealthCheckAt,
                        Habitat = an.Species?.Habitat,
                        Diet = an.Species?.Diet,
                        Lifespan = an.Species?.Lifespan,
                        Status = an.Status.ToString(),
                        CreatedAt = an.CreatedAt,
                        UpdatedAt = an.UpdatedAt
                    };
                }).ToList()
            };
        }).ToList() ?? new List<EnclosureResponse>();

        var activeAreaAnimalsCount = a.Animals?.Count(an => an.Status == AnimalStatus.Active || an.Status == AnimalStatus.UnderTreatment) ?? 0;

        return new AreaResponseDto
        {
            AreaId = a.AreaId,
            Code = code,
            OriginalName = a.Name,
            Name = areaDisplayName,
            Description = areaDisplayDesc,
            LanguageCode = lang,
            HasTranslation = hasAreaTr,
            ReferenceSource = areaTr?.SourceReference ?? a.ReferenceSource,
            Latitude = a.Latitude,
            Longitude = a.Longitude,
            RadiusMeters = a.RadiusMeters,
            MapImageUrl = a.MapImageUrl,
            MapX = a.MapX,
            MapY = a.MapY,
            Status = a.Status.ToString(),
            EnclosureCount = enclosures.Count,
            AnimalCount = activeAreaAnimalsCount,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,
            Enclosures = enclosures
        };
    }

    /// <summary>
    /// Công thức Haversine tính cự ly giữa 2 tọa độ GPS (bán kính Trái Đất ~ 6,371,000 m)
    /// </summary>
    private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusMeters = 6371000;

        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        double radLat1 = ToRadians(lat1);
        double radLat2 = ToRadians(lat2);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(radLat1) * Math.Cos(radLat2) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusMeters * c;
    }

    /// <summary>
    /// Tính góc phương vị di chuyển từ điểm A đến điểm B (0 - 360 độ)
    /// </summary>
    private static double CalculateBearing(double lat1, double lon1, double lat2, double lon2)
    {
        double dLon = ToRadians(lon2 - lon1);
        double radLat1 = ToRadians(lat1);
        double radLat2 = ToRadians(lat2);

        double y = Math.Sin(dLon) * Math.Cos(radLat2);
        double x = Math.Cos(radLat1) * Math.Sin(radLat2) -
                   Math.Sin(radLat1) * Math.Cos(radLat2) * Math.Cos(dLon);

        double bearing = Math.Atan2(y, x);
        double degrees = ToDegrees(bearing);

        return (degrees + 360.0) % 360.0;
    }

    private static string BearingToCompass(double degrees)
    {
        string[] directions = { "Bắc (N)", "Đông Bắc (NE)", "Đông (E)", "Đông Nam (SE)", "Nam (S)", "Tây Nam (SW)", "Tây (W)", "Tây Bắc (NW)" };
        int index = (int)Math.Round(((degrees % 360) / 45)) % 8;
        return directions[index];
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
    private static double ToDegrees(double radians) => radians * 180.0 / Math.PI;

    #endregion
}
