using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Services;

public class EnclosureService : IEnclosureService
{
    private readonly IEnclosureRepository _enclosureRepository;
    private readonly IAnimalRepository _animalRepository;
    private readonly IAreaRepository _areaRepository;

    public EnclosureService(
        IEnclosureRepository enclosureRepository,
        IAnimalRepository animalRepository,
        IAreaRepository areaRepository)
    {
        _enclosureRepository = enclosureRepository;
        _animalRepository = animalRepository;
        _areaRepository = areaRepository;
    }

    public async Task<IEnumerable<EnclosureResponseDto>> GetEnclosuresAsync(EnclosureFilterDto filter)
    {
        var enclosures = await _enclosureRepository.GetAllWithDetailsAsync(
            filter.AreaId, 
            filter.Search, 
            filter.Status);

        return enclosures.Select(MapToResponseDto);
    }

    public async Task<EnclosureDetailDto?> GetEnclosureByIdAsync(int id)
    {
        var enclosure = await _enclosureRepository.GetByIdWithDetailsAsync(id);
        if (enclosure == null) return null;

        var dto = new EnclosureDetailDto
        {
            EnclosureId = enclosure.EnclosureId,
            AreaId = enclosure.AreaId,
            AreaName = enclosure.Area.Name,
            AreaCode = enclosure.Area.Code,
            Code = enclosure.Code ?? $"ENC-{enclosure.EnclosureId:D3}",
            Name = enclosure.Name,
            Description = enclosure.Description,
            ImageUrl = enclosure.ImageUrl,
            Status = enclosure.Status,
            MapX = enclosure.MapX,
            MapY = enclosure.MapY,
            AnimalCount = enclosure.Animals.Count,
            CreatedAt = enclosure.CreatedAt,
            UpdatedAt = enclosure.UpdatedAt,
            Animals = enclosure.Animals.Select(MapAnimalToDto).ToList(),
            Area = new AreaResponseDto
            {
                AreaId = enclosure.Area.AreaId,
                Code = enclosure.Area.Code ?? "A",
                Name = enclosure.Area.Name,
                Description = enclosure.Area.Description,
                Latitude = enclosure.Area.Latitude,
                Longitude = enclosure.Area.Longitude,
                RadiusMeters = enclosure.Area.RadiusMeters,
                MapImageUrl = enclosure.Area.MapImageUrl,
                MapX = enclosure.Area.MapX,
                MapY = enclosure.Area.MapY,
                Status = enclosure.Area.Status.ToString(),
                CreatedAt = enclosure.Area.CreatedAt,
                UpdatedAt = enclosure.Area.UpdatedAt
            }
        };

        return dto;
    }

    public async Task<(EnclosureResponseDto? Data, string? ErrorMessage)> CreateEnclosureAsync(CreateEnclosureDto dto)
    {
        var areaExists = await _enclosureRepository.AreaExistsAsync(dto.AreaId);
        if (!areaExists)
        {
            return (null, $"Phân khu với mã ID = {dto.AreaId} không tồn tại.");
        }

        var area = await _areaRepository.GetByIdAsync(dto.AreaId);
        var areaCode = area?.Code ?? "Z";

        string code = dto.Code?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code))
        {
            code = $"ENC-{areaCode}-{DateTime.UtcNow.Ticks % 10000:D4}";
        }

        var enclosure = new Enclosure
        {
            AreaId = dto.AreaId,
            Code = code,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
            MapX = dto.MapX,
            MapY = dto.MapY,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _enclosureRepository.AddAsync(enclosure);
        var full = await _enclosureRepository.GetByIdWithDetailsAsync(created.EnclosureId);
        return (MapToResponseDto(full ?? created), null);
    }

    public async Task<(EnclosureResponseDto? Data, bool NotFound, string? ErrorMessage)> UpdateEnclosureAsync(int id, UpdateEnclosureDto dto)
    {
        var enclosure = await _enclosureRepository.GetByIdAsync(id);
        if (enclosure == null)
        {
            return (null, true, $"Không tìm thấy chuồng với mã ID = {id}.");
        }

        if (enclosure.AreaId != dto.AreaId)
        {
            var areaExists = await _enclosureRepository.AreaExistsAsync(dto.AreaId);
            if (!areaExists)
            {
                return (null, false, $"Phân khu với mã ID = {dto.AreaId} không tồn tại.");
            }
            enclosure.AreaId = dto.AreaId;
        }

        if (!string.IsNullOrWhiteSpace(dto.Code))
        {
            enclosure.Code = dto.Code.Trim();
        }

        enclosure.Name = dto.Name.Trim();
        enclosure.Description = dto.Description?.Trim();
        enclosure.ImageUrl = dto.ImageUrl?.Trim();
        enclosure.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status;
        enclosure.MapX = dto.MapX;
        enclosure.MapY = dto.MapY;
        enclosure.UpdatedAt = DateTime.UtcNow;

        await _enclosureRepository.UpdateAsync(enclosure);

        var full = await _enclosureRepository.GetByIdWithDetailsAsync(id);
        return (MapToResponseDto(full ?? enclosure), false, null);
    }

    public async Task<(bool Success, bool NotFound, bool HasConflict, string? Message)> DeleteEnclosureAsync(int id)
    {
        var enclosure = await _enclosureRepository.GetByIdAsync(id);
        if (enclosure == null)
        {
            return (false, true, false, $"Không tìm thấy chuồng với mã ID = {id}.");
        }

        var hasAnimals = await _enclosureRepository.HasAnimalsAsync(id);
        if (hasAnimals)
        {
            return (false, false, true, "Chuồng đang có động vật sinh sống. Vui lòng chuyển các cá thể sang chuồng khác trước khi xóa chuồng này.");
        }

        await _enclosureRepository.DeleteAsync(enclosure);
        return (true, false, false, "Đã xóa chuồng thành công.");
    }

    public async Task<(bool Success, string? Message)> MoveAnimalAsync(MoveAnimalDto dto)
    {
        var animal = await _animalRepository.GetByIdAsync(dto.AnimalId);
        if (animal == null)
        {
            return (false, $"Không tìm thấy cá thể động vật với mã ID = {dto.AnimalId}.");
        }

        if (dto.TargetEnclosureId.HasValue && dto.TargetEnclosureId.Value > 0)
        {
            var targetEnclosure = await _enclosureRepository.GetByIdAsync(dto.TargetEnclosureId.Value);
            if (targetEnclosure == null)
            {
                return (false, $"Chuồng đích với mã ID = {dto.TargetEnclosureId.Value} không tồn tại.");
            }

            animal.EnclosureId = targetEnclosure.EnclosureId;
            animal.AreaId = targetEnclosure.AreaId; // Tự động đồng bộ AreaId theo chuồng đích
            animal.UpdatedAt = DateTime.UtcNow;

            await _animalRepository.UpdateAsync(animal);
            return (true, $"Đã chuyển động vật '{animal.Name}' sang '{targetEnclosure.Name}'.");
        }
        else
        {
            animal.EnclosureId = null;
            animal.UpdatedAt = DateTime.UtcNow;

            await _animalRepository.UpdateAsync(animal);
            return (true, $"Đã gỡ động vật '{animal.Name}' ra khỏi chuồng (trạng thái Chưa xếp chuồng).");
        }
    }

    private static EnclosureResponseDto MapToResponseDto(Enclosure e)
    {
        return new EnclosureResponseDto
        {
            EnclosureId = e.EnclosureId,
            AreaId = e.AreaId,
            AreaName = e.Area?.Name ?? string.Empty,
            AreaCode = e.Area?.Code,
            Code = e.Code ?? $"ENC-{e.EnclosureId:D3}",
            Name = e.Name,
            Description = e.Description,
            ImageUrl = e.ImageUrl,
            Status = e.Status,
            MapX = e.MapX,
            MapY = e.MapY,
            AnimalCount = e.Animals?.Count ?? 0,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
            Animals = e.Animals?.Select(MapAnimalToDto).ToList() ?? new List<AnimalResponseDto>()
        };
    }

    private static AnimalResponseDto MapAnimalToDto(Animal a)
    {
        return new AnimalResponseDto
        {
            AnimalId = a.AnimalId,
            SpeciesId = a.SpeciesId,
            SpeciesName = a.Species?.Name ?? string.Empty,
            ScientificName = a.Species?.ScientificName,
            ConservationStatus = a.Species?.ConservationStatus,
            AreaId = a.AreaId,
            AreaName = a.Area?.Name ?? string.Empty,
            EnclosureId = a.EnclosureId,
            EnclosureName = a.Enclosure?.Name,
            EnclosureCode = a.Enclosure?.Code,
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
