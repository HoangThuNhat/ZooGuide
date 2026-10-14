using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Services;

/// <summary>
/// Xử lý nghiệp vụ quản lý chuồng trại (Enclosures)
/// </summary>
public class EnclosureService : IEnclosureService
{
    private readonly IEnclosureRepository _enclosureRepository;
    private readonly IAreaRepository _areaRepository;
    private readonly IAnimalRepository _animalRepository;

    public EnclosureService(
        IEnclosureRepository enclosureRepository,
        IAreaRepository areaRepository,
        IAnimalRepository animalRepository)
    {
        _enclosureRepository = enclosureRepository;
        _areaRepository = areaRepository;
        _animalRepository = animalRepository;
    }

    public async Task<IEnumerable<EnclosureResponse>> GetAllAsync(EnclosureFilterRequest? filter = null)
    {
        var enclosures = await _enclosureRepository.GetAllAsync(filter?.AreaId, filter?.Search, filter?.Status);
        return enclosures.Select(e => MapToResponse(e));
    }

    public async Task<EnclosureDetailResponse?> GetByIdAsync(int id)
    {
        var enclosure = await _enclosureRepository.GetByIdWithDetailsAsync(id);
        return enclosure == null ? null : MapToDetailResponse(enclosure);
    }

    public async Task<IEnumerable<EnclosureResponse>?> GetByAreaIdAsync(int areaId)
    {
        // Kiểm tra khu vực có tồn tại trong hệ thống không
        var area = await _areaRepository.GetByIdAsync(areaId);
        if (area == null)
        {
            return null;
        }

        var enclosures = await _enclosureRepository.GetByAreaIdAsync(areaId);
        return enclosures.Select(e => MapToResponse(e, area.Name, area.Code));
    }

    public async Task<EnclosureResponse> CreateAsync(CreateEnclosureRequest request)
    {
        // Kiểm tra AreaId có tồn tại trong bảng AREAS không
        var area = await _areaRepository.GetByIdAsync(request.AreaId);
        if (area == null)
        {
            throw new ArgumentException($"Khu vực với AreaId = {request.AreaId} không tồn tại trong hệ thống.");
        }

        var code = request.Code?.Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            code = $"ENC-{area.Code ?? "Z"}-{DateTime.UtcNow.Ticks % 10000:D4}";
        }

        var enclosure = new Enclosure
        {
            AreaId = request.AreaId,
            Code = code,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim(),
            MapX = request.MapX,
            MapY = request.MapY,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _enclosureRepository.CreateAsync(enclosure);
        var full = await _enclosureRepository.GetByIdWithDetailsAsync(created.EnclosureId) ?? created;
        return MapToResponse(full, area.Name, area.Code);
    }

    public async Task<EnclosureResponse?> UpdateAsync(int id, UpdateEnclosureRequest request)
    {
        var enclosure = await _enclosureRepository.GetByIdAsync(id);
        if (enclosure == null)
        {
            return null;
        }

        // Kiểm tra AreaId có tồn tại trong bảng AREAS không
        var area = await _areaRepository.GetByIdAsync(request.AreaId);
        if (area == null)
        {
            throw new ArgumentException($"Khu vực với AreaId = {request.AreaId} không tồn tại trong hệ thống.");
        }

        enclosure.AreaId = request.AreaId;
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            enclosure.Code = request.Code.Trim();
        }
        enclosure.Name = request.Name.Trim();
        enclosure.Description = request.Description?.Trim();
        enclosure.ImageUrl = request.ImageUrl?.Trim();
        enclosure.Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim();
        enclosure.MapX = request.MapX;
        enclosure.MapY = request.MapY;
        enclosure.UpdatedAt = DateTime.UtcNow;
        // CreatedAt được giữ nguyên

        await _enclosureRepository.UpdateAsync(enclosure);

        var full = await _enclosureRepository.GetByIdWithDetailsAsync(id) ?? enclosure;
        return MapToResponse(full, area.Name, area.Code);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var enclosure = await _enclosureRepository.GetByIdAsync(id);
        if (enclosure == null)
        {
            return false;
        }

        // Ràng buộc: không xóa chuồng khi vẫn còn cá thể động vật bên trong
        if (await _enclosureRepository.HasAnimalsAsync(id))
        {
            throw new InvalidOperationException(
                "Chuồng đang có động vật sinh sống. Vui lòng chuyển các cá thể sang chuồng khác trước khi xóa chuồng này.");
        }

        await _enclosureRepository.DeleteAsync(enclosure);
        return true;
    }

    public async Task<string> MoveAnimalAsync(MoveAnimalRequest request)
    {
        var animal = await _animalRepository.GetByIdAsync(request.AnimalId);
        if (animal == null)
        {
            throw new ArgumentException($"Không tìm thấy cá thể động vật với mã ID = {request.AnimalId}.");
        }

        if (request.TargetEnclosureId.HasValue && request.TargetEnclosureId.Value > 0)
        {
            var target = await _enclosureRepository.GetByIdAsync(request.TargetEnclosureId.Value);
            if (target == null)
            {
                throw new ArgumentException($"Chuồng đích với mã ID = {request.TargetEnclosureId.Value} không tồn tại.");
            }

            animal.EnclosureId = target.EnclosureId;
            animal.AreaId = target.AreaId; // Tự động đồng bộ AreaId theo chuồng đích
            animal.UpdatedAt = DateTime.UtcNow;

            await _animalRepository.UpdateAsync(animal);
            return $"Đã chuyển động vật '{animal.Name}' sang '{target.Name}'.";
        }

        animal.EnclosureId = null;
        animal.UpdatedAt = DateTime.UtcNow;

        await _animalRepository.UpdateAsync(animal);
        return $"Đã gỡ động vật '{animal.Name}' ra khỏi chuồng (trạng thái Chưa xếp chuồng).";
    }

    private static EnclosureResponse MapToResponse(Enclosure e, string? areaName = null, string? areaCode = null)
    {
        var response = new EnclosureResponse();
        FillResponse(response, e, areaName, areaCode);
        return response;
    }

    private static EnclosureDetailResponse MapToDetailResponse(Enclosure e)
    {
        var response = new EnclosureDetailResponse();
        FillResponse(response, e, null, null);

        if (e.Area != null)
        {
            response.Area = new AreaResponseDto
            {
                AreaId = e.Area.AreaId,
                Code = e.Area.Code ?? "A",
                Name = e.Area.Name,
                Description = e.Area.Description,
                Latitude = e.Area.Latitude,
                Longitude = e.Area.Longitude,
                RadiusMeters = e.Area.RadiusMeters,
                MapImageUrl = e.Area.MapImageUrl,
                MapX = e.Area.MapX,
                MapY = e.Area.MapY,
                Status = e.Area.Status.ToString(),
                CreatedAt = e.Area.CreatedAt,
                UpdatedAt = e.Area.UpdatedAt
            };
        }

        return response;
    }

    private static void FillResponse(EnclosureResponse target, Enclosure e, string? areaName, string? areaCode)
    {
        target.EnclosureId = e.EnclosureId;
        target.AreaId = e.AreaId;
        target.AreaName = areaName ?? e.Area?.Name ?? string.Empty;
        target.AreaCode = areaCode ?? e.Area?.Code;
        target.Code = e.Code ?? $"ENC-{e.EnclosureId:D3}";
        target.Name = e.Name;
        target.Description = e.Description;
        target.ImageUrl = e.ImageUrl;
        target.Status = e.Status;
        target.MapX = e.MapX;
        target.MapY = e.MapY;
        target.AnimalCount = e.Animals?.Count ?? 0;
        target.CreatedAt = e.CreatedAt;
        target.UpdatedAt = e.UpdatedAt;
        target.Animals = e.Animals?.Select(a => MapAnimalToDto(a, e, target.AreaName)).ToList()
                         ?? new List<AnimalResponseDto>();
    }

    private static AnimalResponseDto MapAnimalToDto(Animal a, Enclosure e, string areaName)
    {
        return new AnimalResponseDto
        {
            AnimalId = a.AnimalId,
            SpeciesId = a.SpeciesId,
            SpeciesName = a.Species?.Name ?? string.Empty,
            ScientificName = a.Species?.ScientificName,
            ConservationStatus = a.Species?.ConservationStatus,
            AreaId = a.AreaId,
            AreaName = a.Area?.Name ?? areaName,
            EnclosureId = a.EnclosureId,
            EnclosureName = e.Name,
            EnclosureCode = e.Code,
            Name = a.Name,
            Description = a.Description,
            Gender = a.Gender.ToString(),
            DateOfBirth = a.DateOfBirth,
            Origin = a.Origin,
            HealthStatus = a.HealthStatus,
            ConservationNote = a.ConservationNote,
            ImageUrl = a.ImageUrl,
            Status = a.Status.ToString(),
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
    }
}
