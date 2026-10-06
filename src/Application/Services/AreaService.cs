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

    public async Task<IEnumerable<AreaResponseDto>> GetAllAreasAsync()
    {
        var areas = await _areaRepository.GetAllWithAnimalsAsync();
        return areas.Select(MapToResponseDto);
    }

    public async Task<AreaResponseDto?> GetAreaByIdAsync(int areaId)
    {
        var area = await _areaRepository.GetByIdWithAnimalsAsync(areaId);
        return area == null ? null : MapToResponseDto(area);
    }

    public async Task<AreaResponseDto> CreateAreaAsync(CreateAreaDto dto)
    {
        // Khởi tạo entity khu vực mới
        var area = new Area
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            RadiusMeters = dto.RadiusMeters,
            MapImageUrl = dto.MapImageUrl?.Trim(),
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

        // Cập nhật thông tin và tọa độ kiểm định
        area.Name = dto.Name.Trim();
        area.Description = dto.Description?.Trim();
        area.Latitude = dto.Latitude;
        area.Longitude = dto.Longitude;
        area.RadiusMeters = dto.RadiusMeters;
        area.MapImageUrl = dto.MapImageUrl?.Trim();
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

    private static AreaResponseDto MapToResponseDto(Area a)
    {
        // Tạo mã phân khu: A, B, C... dựa vào AreaId
        string code = a.AreaId > 0 && a.AreaId <= 26 
            ? ((char)('A' + a.AreaId - 1)).ToString() 
            : $"Z{a.AreaId}";

        return new AreaResponseDto
        {
            AreaId = a.AreaId,
            Code = code,
            Name = a.Name,
            Description = a.Description,
            Latitude = a.Latitude,
            Longitude = a.Longitude,
            RadiusMeters = a.RadiusMeters,
            MapImageUrl = a.MapImageUrl,
            Status = a.Status.ToString(),
            AnimalCount = a.Animals?.Count ?? 0,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
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
