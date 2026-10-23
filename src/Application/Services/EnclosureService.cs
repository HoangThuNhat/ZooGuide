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
        var normalizedLang = NormalizeLang(filter?.Lang);
        var enclosures = await _enclosureRepository.GetAllAsync(filter?.AreaId, filter?.Search, filter?.Status);
        var translations = await _enclosureRepository.GetTranslationsByLanguageAsync(normalizedLang);
        return enclosures.Select(e => MapToResponse(e, null, null, normalizedLang, translations));
    }

    public async Task<EnclosureDetailResponse?> GetByIdAsync(int id, string? lang = null)
    {
        var normalizedLang = NormalizeLang(lang);
        var enclosure = await _enclosureRepository.GetByIdWithDetailsAsync(id);
        if (enclosure == null) return null;
        var translations = await _enclosureRepository.GetTranslationsByLanguageAsync(normalizedLang);
        return MapToDetailResponse(enclosure, normalizedLang, translations);
    }

    public async Task<IEnumerable<EnclosureResponse>?> GetByAreaIdAsync(int areaId, string? lang = null)
    {
        var normalizedLang = NormalizeLang(lang);
        var area = await _areaRepository.GetByIdAsync(areaId);
        if (area == null)
        {
            return null;
        }

        var enclosures = await _enclosureRepository.GetByAreaIdAsync(areaId);
        var translations = await _enclosureRepository.GetTranslationsByLanguageAsync(normalizedLang);
        return enclosures.Select(e => MapToResponse(e, area.Name, area.Code, normalizedLang, translations));
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
            Latitude = request.Latitude,
            Longitude = request.Longitude,
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
        enclosure.Latitude = request.Latitude;
        enclosure.Longitude = request.Longitude;
        enclosure.UpdatedAt = DateTime.UtcNow;

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

    private static string NormalizeLang(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return "vi";
        var c = code.Trim().ToLowerInvariant();
        return (c == "zh-cn" || c == "zh_cn" || c == "zh-hans") ? "zh" : c;
    }

    private static EnclosureResponse MapToResponse(Enclosure e, string? areaName = null, string? areaCode = null, string lang = "vi", List<ContentTranslation>? translations = null)
    {
        var response = new EnclosureResponse();
        FillResponse(response, e, areaName, areaCode, lang, translations);
        return response;
    }

    private static EnclosureDetailResponse MapToDetailResponse(Enclosure e, string lang = "vi", List<ContentTranslation>? translations = null)
    {
        var response = new EnclosureDetailResponse();
        FillResponse(response, e, null, null, lang, translations);

        if (e.Area != null)
        {
            bool isDefaultVi = lang == "vi";
            var areaTr = translations?.FirstOrDefault(ct => ct.EntityType == "Area" && ct.EntityId == e.Area.AreaId);
            bool hasAreaTr = isDefaultVi || (areaTr != null && !string.IsNullOrWhiteSpace(areaTr.Title));

            response.Area = new AreaResponseDto
            {
                AreaId = e.Area.AreaId,
                Code = e.Area.Code ?? "A",
                OriginalName = e.Area.Name,
                Name = areaTr != null && !string.IsNullOrWhiteSpace(areaTr.Title) ? areaTr.Title : e.Area.Name,
                Description = areaTr != null && !string.IsNullOrWhiteSpace(areaTr.Description) ? areaTr.Description : (hasAreaTr ? e.Area.Description : null),
                LanguageCode = lang,
                HasTranslation = hasAreaTr,
                ReferenceSource = areaTr?.SourceReference ?? e.Area.ReferenceSource,
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

    private static void FillResponse(EnclosureResponse target, Enclosure e, string? areaName, string? areaCode, string lang = "vi", List<ContentTranslation>? translations = null)
    {
        bool isDefaultVi = lang == "vi";
        var encTr = translations?.FirstOrDefault(ct => ct.EntityType == "Enclosure" && ct.EntityId == e.EnclosureId);
        var areaTr = translations?.FirstOrDefault(ct => ct.EntityType == "Area" && ct.EntityId == e.AreaId);
        bool hasEncTr = isDefaultVi || (encTr != null && !string.IsNullOrWhiteSpace(encTr.Title));

        var rawAreaName = areaName ?? e.Area?.Name ?? string.Empty;
        var localizedAreaName = areaTr != null && !string.IsNullOrWhiteSpace(areaTr.Title) ? areaTr.Title : rawAreaName;
        var localizedEncName = encTr != null && !string.IsNullOrWhiteSpace(encTr.Title) ? encTr.Title : e.Name;
        var localizedEncDesc = encTr != null && !string.IsNullOrWhiteSpace(encTr.Description) ? encTr.Description : (hasEncTr ? e.Description : null);

        var activeAnimals = e.Animals?.Where(a => a.Status == ZooGuide.Domain.Enums.AnimalStatus.Active || a.Status == ZooGuide.Domain.Enums.AnimalStatus.UnderTreatment).ToList()
                            ?? new List<Animal>();

        target.EnclosureId = e.EnclosureId;
        target.AreaId = e.AreaId;
        target.AreaName = localizedAreaName;
        target.AreaCode = areaCode ?? e.Area?.Code;
        target.Code = e.Code ?? $"ENC-{e.EnclosureId:D3}";
        target.OriginalName = e.Name;
        target.Name = localizedEncName;
        target.Description = localizedEncDesc;
        target.LanguageCode = lang;
        target.HasTranslation = hasEncTr;
        target.ReferenceSource = encTr?.SourceReference ?? e.ReferenceSource;
        target.ImageUrl = e.ImageUrl;
        target.Status = e.Status;
        target.MapX = e.MapX;
        target.MapY = e.MapY;
        target.Latitude = e.Latitude;
        target.Longitude = e.Longitude;
        target.AnimalCount = activeAnimals.Count;
        target.CreatedAt = e.CreatedAt;
        target.UpdatedAt = e.UpdatedAt;
        target.Animals = activeAnimals.Select(a => MapAnimalToDto(a, e, localizedAreaName, localizedEncName, lang, translations)).ToList();
    }

    private static AnimalResponseDto MapAnimalToDto(Animal a, Enclosure e, string areaName, string encName, string lang, List<ContentTranslation>? translations)
    {
        bool isDefaultVi = lang == "vi";
        var anTr = translations?.FirstOrDefault(ct => ct.EntityType == "Animal" && ct.EntityId == a.AnimalId);
        var spTr = a.Species != null ? translations?.FirstOrDefault(ct => ct.EntityType == "Species" && ct.EntityId == a.SpeciesId) : null;
        bool hasAnTr = isDefaultVi || (anTr != null && !string.IsNullOrWhiteSpace(anTr.Title));

        return new AnimalResponseDto
        {
            AnimalId = a.AnimalId,
            SpeciesId = a.SpeciesId,
            SpeciesName = spTr != null && !string.IsNullOrWhiteSpace(spTr.Title) ? spTr.Title : (a.Species?.Name ?? string.Empty),
            ScientificName = a.Species?.ScientificName,
            ConservationStatus = a.Species?.ConservationStatus,
            AreaId = a.AreaId,
            AreaName = areaName,
            EnclosureId = a.EnclosureId,
            EnclosureName = encName,
            EnclosureCode = e.Code,
            OriginalName = a.Name,
            Name = anTr != null && !string.IsNullOrWhiteSpace(anTr.Title) ? anTr.Title : a.Name,
            Description = anTr != null && !string.IsNullOrWhiteSpace(anTr.Description) ? anTr.Description : (hasAnTr ? a.Description : null),
            LanguageCode = lang,
            HasTranslation = hasAnTr,
            ReferenceSource = anTr?.SourceReference ?? a.ReferenceSource,
            Gender = a.Gender.ToString(),
            DateOfBirth = a.DateOfBirth,
            Origin = a.Origin,
            HealthStatus = a.HealthStatus,
            ConservationNote = a.ConservationNote,
            ImageUrl = a.ImageUrl,
            WeightKg = a.WeightKg,
            TemperatureC = a.TemperatureC,
            VeterinarianName = a.VeterinarianName,
            HealthActionRequired = a.HealthActionRequired,
            LastHealthCheckAt = a.LastHealthCheckAt,
            Habitat = a.Species?.Habitat,
            Diet = a.Species?.Diet,
            Lifespan = a.Species?.Lifespan,
            Status = a.Status.ToString(),
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
    }
}
