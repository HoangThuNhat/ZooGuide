using System.Text.Json;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Application.Services;

/// <summary>
/// Xử lý nghiệp vụ quản lý hồ sơ cá thể động vật (Animals) và phân loại giống loài
/// </summary>
public class AnimalService : IAnimalService
{
    private readonly IAnimalRepository _animalRepository;

    public AnimalService(IAnimalRepository animalRepository)
    {
        _animalRepository = animalRepository;
    }

    public async Task<IEnumerable<AnimalResponseDto>> GetAnimalsAsync(AnimalFilterDto? filter)
    {
        var normalizedLang = NormalizeLang(filter?.Lang);
        var animals = await _animalRepository.GetAllWithDetailsAsync(
            filter?.Search,
            filter?.AreaId,
            filter?.ZoneId,
            filter?.SpeciesId,
            filter?.IucnStatus,
            filter?.EnclosureId);

        var translations = await _animalRepository.GetTranslationsByLanguageAsync(normalizedLang);
        return animals.Select(a => MapToResponseDto(a, normalizedLang, translations));
    }

    public async Task<AnimalDetailDto?> GetAnimalByIdAsync(int animalId, string? lang = null)
    {
        var normalizedLang = NormalizeLang(lang);
        var animal = await _animalRepository.GetByIdWithDetailsAsync(animalId);
        if (animal == null) return null;

        var translations = await _animalRepository.GetTranslationsByLanguageAsync(normalizedLang);
        var dto = MapToResponseDto(animal, normalizedLang, translations);
        bool isDefaultVi = normalizedLang == "vi";
        var spTr = animal.Species != null ? translations.FirstOrDefault(ct => ct.EntityType == "Species" && ct.EntityId == animal.Species.SpeciesId) : null;
        var areaTr = animal.Area != null ? translations.FirstOrDefault(ct => ct.EntityType == "Area" && ct.EntityId == animal.Area.AreaId) : null;
        var encTr = animal.Enclosure != null ? translations.FirstOrDefault(ct => ct.EntityType == "Enclosure" && ct.EntityId == animal.Enclosure.EnclosureId) : null;

        return new AnimalDetailDto
        {
            AnimalId = dto.AnimalId,
            SpeciesId = dto.SpeciesId,
            SpeciesName = dto.SpeciesName,
            ScientificName = dto.ScientificName,
            ConservationStatus = dto.ConservationStatus,
            AreaId = dto.AreaId,
            AreaName = dto.AreaName,
            EnclosureId = dto.EnclosureId,
            EnclosureName = dto.EnclosureName,
            EnclosureCode = dto.EnclosureCode,
            OriginalName = dto.OriginalName,
            Name = dto.Name,
            Description = dto.Description,
            LanguageCode = dto.LanguageCode,
            HasTranslation = dto.HasTranslation,
            ReferenceSource = dto.ReferenceSource,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            Origin = dto.Origin,
            HealthStatus = dto.HealthStatus,
            ConservationNote = dto.ConservationNote,
            ImageUrl = dto.ImageUrl,
            WeightKg = dto.WeightKg,
            TemperatureC = dto.TemperatureC,
            VeterinarianName = dto.VeterinarianName,
            HealthActionRequired = dto.HealthActionRequired,
            LastHealthCheckAt = dto.LastHealthCheckAt,
            Habitat = dto.Habitat,
            Diet = dto.Diet,
            Lifespan = dto.Lifespan,
            Status = dto.Status,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            Species = animal.Species == null ? null : new SpeciesDetailDto
            {
                SpeciesId = animal.Species.SpeciesId,
                OriginalName = animal.Species.Name,
                Name = dto.SpeciesName,
                ScientificName = animal.Species.ScientificName,
                Description = ResolveSpeciesDescription(animal.Species, normalizedLang, spTr),
                ConservationStatus = dto.ConservationStatus,
                ImageUrl = animal.Species.ImageUrl,
                Habitat = dto.Habitat,
                Diet = dto.Diet,
                Lifespan = dto.Lifespan,
                ReferenceSource = spTr?.SourceReference ?? animal.Species.ReferenceSource,
                LanguageCode = normalizedLang,
                HasTranslation = isDefaultVi || LocalizationHelper.HasValidDbTranslation(spTr?.Title, animal.Species.Name, normalizedLang) || (normalizedLang == "en" && LocalizationHelper.TryGetEnglishSpecies(animal.Species.ScientificName, out _))
            },
            Area = animal.Area == null ? null : new AreaResponseDto
            {
                AreaId = animal.Area.AreaId,
                Code = animal.Area.Code ?? "A",
                OriginalName = animal.Area.Name,
                Name = dto.AreaName,
                Description = LocalizationHelper.HasValidDbTranslation(areaTr?.Title, animal.Area.Name, normalizedLang) && !string.IsNullOrWhiteSpace(areaTr?.Description)
                    ? areaTr.Description
                    : (isDefaultVi ? animal.Area.Description : null),
                LanguageCode = normalizedLang,
                HasTranslation = isDefaultVi || LocalizationHelper.HasValidDbTranslation(areaTr?.Title, animal.Area.Name, normalizedLang),
                ReferenceSource = areaTr?.SourceReference ?? animal.Area.ReferenceSource,
                Latitude = animal.Area.Latitude,
                Longitude = animal.Area.Longitude,
                RadiusMeters = animal.Area.RadiusMeters,
                MapImageUrl = animal.Area.MapImageUrl,
                MapX = animal.Area.MapX,
                MapY = animal.Area.MapY,
                Status = animal.Area.Status.ToString()
            },
            Enclosure = animal.Enclosure == null ? null : new EnclosureResponse
            {
                EnclosureId = animal.Enclosure.EnclosureId,
                AreaId = animal.Enclosure.AreaId,
                AreaName = dto.AreaName,
                Code = animal.Enclosure.Code ?? $"ENC-{animal.Enclosure.EnclosureId:D3}",
                OriginalName = animal.Enclosure.Name,
                Name = dto.EnclosureName ?? animal.Enclosure.Name,
                Description = ResolveEnclosureDescription(animal.Enclosure, normalizedLang, encTr),
                LanguageCode = normalizedLang,
                HasTranslation = isDefaultVi || LocalizationHelper.HasValidDbTranslation(encTr?.Title, animal.Enclosure.Name, normalizedLang) || (normalizedLang == "en" && LocalizationHelper.TryGetEnglishEnclosure(animal.Enclosure.Code, out _)),
                ReferenceSource = encTr?.SourceReference ?? animal.Enclosure.ReferenceSource,
                ImageUrl = animal.Enclosure.ImageUrl,
                Status = animal.Enclosure.Status,
                MapX = animal.Enclosure.MapX,
                MapY = animal.Enclosure.MapY,
                Latitude = animal.Enclosure.Latitude,
                Longitude = animal.Enclosure.Longitude,
                RadiusMeters = LocalizationHelper.GetRecommendedEnclosureRadiusMeters(animal.Enclosure.Code),
                CreatedAt = animal.Enclosure.CreatedAt,
                UpdatedAt = animal.Enclosure.UpdatedAt
            }
        };
    }

    public async Task<(AnimalResponseDto? Data, string? ErrorMessage)> CreateAnimalAsync(CreateAnimalDto dto)
    {
        // 1. Kiểm tra giống loài (SpeciesId) có tồn tại trong DB không
        bool speciesExists = await _animalRepository.SpeciesExistsAsync(dto.SpeciesId);
        if (!speciesExists)
        {
            return (null, $"Giống loài với SpeciesId = {dto.SpeciesId} không tồn tại trong hệ thống.");
        }

        // 2. Kiểm tra phân khu chuồng trại (AreaId) có tồn tại không
        bool areaExists = await _animalRepository.AreaExistsAsync(dto.AreaId);
        if (!areaExists)
        {
            return (null, $"Khu vực phân chuồng với AreaId = {dto.AreaId} không tồn tại trong hệ thống.");
        }

        // 3. Kiểm tra chuồng nếu được chỉ định
        if (dto.EnclosureId.HasValue && dto.EnclosureId.Value > 0)
        {
            bool enclosureExists = await _animalRepository.EnclosureExistsAsync(dto.EnclosureId.Value);
            if (!enclosureExists)
            {
                return (null, $"Chuồng với EnclosureId = {dto.EnclosureId.Value} không tồn tại trong hệ thống.");
            }
        }

        // 4. Khởi tạo cá thể động vật
        var animal = new Animal
        {
            SpeciesId = dto.SpeciesId,
            AreaId = dto.AreaId,
            EnclosureId = dto.EnclosureId > 0 ? dto.EnclosureId : null,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            Origin = dto.Origin?.Trim(),
            HealthStatus = dto.HealthStatus?.Trim(),
            ConservationNote = dto.ConservationNote?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _animalRepository.AddAsync(animal);
        var createdWithDetails = await _animalRepository.GetByIdWithDetailsAsync(created.AnimalId);

        return (MapToResponseDto(createdWithDetails ?? created), null);
    }

    public async Task<(AnimalResponseDto? Data, string? ErrorMessage, bool NotFound)> UpdateAnimalAsync(int animalId, UpdateAnimalDto dto)
    {
        var animal = await _animalRepository.GetByIdWithDetailsAsync(animalId);
        if (animal == null)
        {
            return (null, "Không tìm thấy hồ sơ động vật.", true);
        }

        // Kiểm tra giống loài mới nếu có thay đổi
        if (animal.SpeciesId != dto.SpeciesId)
        {
            bool speciesExists = await _animalRepository.SpeciesExistsAsync(dto.SpeciesId);
            if (!speciesExists)
            {
                return (null, $"Giống loài mới SpeciesId = {dto.SpeciesId} không tồn tại trong hệ thống.", false);
            }
        }

        // Kiểm tra khu vực mới nếu có thay đổi
        if (animal.AreaId != dto.AreaId)
        {
            bool areaExists = await _animalRepository.AreaExistsAsync(dto.AreaId);
            if (!areaExists)
            {
                return (null, $"Phân khu mới AreaId = {dto.AreaId} không tồn tại trong hệ thống.", false);
            }
        }

        // Kiểm tra chuồng mới nếu có thay đổi
        if (dto.EnclosureId.HasValue && dto.EnclosureId.Value > 0 && animal.EnclosureId != dto.EnclosureId)
        {
            bool enclosureExists = await _animalRepository.EnclosureExistsAsync(dto.EnclosureId.Value);
            if (!enclosureExists)
            {
                return (null, $"Chuồng mới EnclosureId = {dto.EnclosureId.Value} không tồn tại trong hệ thống.", false);
            }
        }

        // Cập nhật thông tin
        animal.SpeciesId = dto.SpeciesId;
        animal.AreaId = dto.AreaId;
        animal.EnclosureId = dto.EnclosureId > 0 ? dto.EnclosureId : null;
        animal.Name = dto.Name.Trim();
        animal.Description = dto.Description?.Trim();
        animal.Gender = dto.Gender;
        animal.DateOfBirth = dto.DateOfBirth;
        animal.Origin = dto.Origin?.Trim();
        animal.HealthStatus = dto.HealthStatus?.Trim();
        animal.ConservationNote = dto.ConservationNote?.Trim();
        animal.ImageUrl = dto.ImageUrl?.Trim();
        animal.Status = dto.Status;
        animal.UpdatedAt = DateTime.UtcNow;

        await _animalRepository.UpdateAsync(animal);
        var updated = await _animalRepository.GetByIdWithDetailsAsync(animalId);

        return (MapToResponseDto(updated ?? animal), null, false);
    }

    public async Task<AnimalResponseDto?> UpdateAnimalHealthAsync(int animalId, UpdateAnimalHealthDto dto)
    {
        var animal = await _animalRepository.GetByIdWithDetailsAsync(animalId);
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

        await _animalRepository.UpdateAsync(animal);
        var updated = await _animalRepository.GetByIdWithDetailsAsync(animalId);
        return MapToResponseDto(updated ?? animal);
    }

    public async Task<(bool Success, bool NotFound, bool HasConflict, string? Message)> DeleteAnimalAsync(int animalId)
    {
        var animal = await _animalRepository.GetByIdAsync(animalId);
        if (animal == null)
        {
            return (false, true, false, "Không tìm thấy hồ sơ động vật.");
        }

        // Kiểm tra các bài thuyết minh liên quan
        bool hasNarrations = await _animalRepository.HasNarrationsAsync(animalId);
        if (hasNarrations)
        {
            // Có dữ liệu thuyết minh -> Chuyển sang trạng thái Transferred (đã chuyển giao) để giữ nguyên vẹn dữ liệu
            animal.Status = AnimalStatus.Transferred;
            animal.UpdatedAt = DateTime.UtcNow;
            await _animalRepository.UpdateAsync(animal);
            return (true, false, true, "Động vật đang có các bài thuyết minh liên kết. Đã chuyển trạng thái sang 'Transferred' (Đã chuyển đi) thay vì xóa hoàn toàn.");
        }

        // Không có ràng buộc -> Xóa an toàn
        await _animalRepository.DeleteAsync(animal);
        return (true, false, false, "Đã xóa hồ sơ động vật thành công.");
    }

    private static string NormalizeLang(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return "vi";
        var c = code.Trim().ToLowerInvariant();
        return (c == "zh-cn" || c == "zh_cn" || c == "zh-hans") ? "zh" : c;
    }

    private static string? ResolveSpeciesDescription(Species sp, string lang, ContentTranslation? spTr)
    {
        if (lang == "vi") return sp.Description;
        if (LocalizationHelper.HasValidDbTranslation(spTr?.Title, sp.Name, lang) &&
            !string.IsNullOrWhiteSpace(spTr?.Description) &&
            !LocalizationHelper.IsUntranslatedVietnamese(spTr.Description, sp.Description, lang))
            return spTr.Description;
        if (lang == "en" && LocalizationHelper.TryGetEnglishSpecies(sp.ScientificName, out var enSp))
            return enSp.Description;
        return null;
    }

    private static string? ResolveEnclosureDescription(Enclosure enc, string lang, ContentTranslation? encTr)
    {
        if (lang == "vi") return enc.Description;
        if (LocalizationHelper.HasValidDbTranslation(encTr?.Title, enc.Name, lang) &&
            !string.IsNullOrWhiteSpace(encTr?.Description) &&
            !LocalizationHelper.IsUntranslatedVietnamese(encTr.Description, enc.Description, lang))
            return encTr.Description;
        if (lang == "en" && LocalizationHelper.TryGetEnglishEnclosure(enc.Code, out var enEnc))
            return enEnc.Description;
        return null;
    }

    private static AnimalResponseDto MapToResponseDto(Animal a, string lang = "vi", List<ContentTranslation>? translations = null)
    {
        bool isDefaultVi = lang == "vi";
        var anTr = translations?.FirstOrDefault(ct => ct.EntityType == "Animal" && ct.EntityId == a.AnimalId);
        var spTr = a.Species != null ? translations?.FirstOrDefault(ct => ct.EntityType == "Species" && ct.EntityId == a.SpeciesId) : null;
        var areaTr = a.Area != null ? translations?.FirstOrDefault(ct => ct.EntityType == "Area" && ct.EntityId == a.AreaId) : null;
        var encTr = a.Enclosure != null && a.EnclosureId.HasValue
            ? translations?.FirstOrDefault(ct => ct.EntityType == "Enclosure" && ct.EntityId == a.EnclosureId.Value)
            : null;

        bool hasValidDbAn = LocalizationHelper.HasValidDbTranslation(anTr?.Title, a.Name, lang);
        EnglishAnimalContent? enAn = null;
        bool hasEnAnimal = lang == "en" && LocalizationHelper.TryGetEnglishAnimal(a.Name, out enAn);
        bool hasAnTr = isDefaultVi || hasValidDbAn || hasEnAnimal;

        bool hasValidDbSp = a.Species != null && LocalizationHelper.HasValidDbTranslation(spTr?.Title, a.Species.Name, lang);
        EnglishSpeciesContent? enSp = null;
        bool hasEnSpecies = lang == "en" && a.Species != null && LocalizationHelper.TryGetEnglishSpecies(a.Species.ScientificName, out enSp);

        bool hasValidDbArea = a.Area != null && LocalizationHelper.HasValidDbTranslation(areaTr?.Title, a.Area.Name, lang);
        bool hasValidDbEnc = a.Enclosure != null && LocalizationHelper.HasValidDbTranslation(encTr?.Title, a.Enclosure.Name, lang);
        EnglishEnclosureContent? enEnc = null;
        bool hasEnEnc = lang == "en" && a.Enclosure != null && LocalizationHelper.TryGetEnglishEnclosure(a.Enclosure.Code, out enEnc);

        string? origin = isDefaultVi ? a.Origin : (hasEnAnimal ? enAn!.Origin : null);
        string? healthStatus = isDefaultVi ? a.HealthStatus : (hasEnAnimal ? enAn!.HealthStatus : null);
        string? conservationNote = isDefaultVi ? a.ConservationNote : null;
        string? habitat = isDefaultVi ? a.Species?.Habitat : (hasEnSpecies ? enSp!.Habitat : null);
        string? diet = isDefaultVi ? a.Species?.Diet : (hasEnSpecies ? enSp!.Diet : null);
        string? lifespan = isDefaultVi ? a.Species?.Lifespan : (hasEnSpecies ? enSp!.Lifespan : null);

        if (anTr != null && !string.IsNullOrWhiteSpace(anTr.ExtraJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(anTr.ExtraJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("origin", out var o) && o.ValueKind == JsonValueKind.String && !LocalizationHelper.IsUntranslatedVietnamese(o.GetString(), a.Origin, lang))
                    origin = o.GetString();
                if (root.TryGetProperty("healthStatus", out var hs) && hs.ValueKind == JsonValueKind.String && !LocalizationHelper.IsUntranslatedVietnamese(hs.GetString(), a.HealthStatus, lang))
                    healthStatus = hs.GetString();
                if (root.TryGetProperty("conservationNote", out var cn) && cn.ValueKind == JsonValueKind.String && !LocalizationHelper.IsUntranslatedVietnamese(cn.GetString(), a.ConservationNote, lang))
                    conservationNote = cn.GetString();
            }
            catch { }
        }

        if (spTr != null && !string.IsNullOrWhiteSpace(spTr.ExtraJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(spTr.ExtraJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("habitat", out var h) && h.ValueKind == JsonValueKind.String && !LocalizationHelper.IsUntranslatedVietnamese(h.GetString(), a.Species?.Habitat, lang))
                    habitat = h.GetString();
                if (root.TryGetProperty("diet", out var d) && d.ValueKind == JsonValueKind.String && !LocalizationHelper.IsUntranslatedVietnamese(d.GetString(), a.Species?.Diet, lang))
                    diet = d.GetString();
                if (root.TryGetProperty("lifespan", out var l) && l.ValueKind == JsonValueKind.String && !LocalizationHelper.IsUntranslatedVietnamese(l.GetString(), a.Species?.Lifespan, lang))
                    lifespan = l.GetString();
            }
            catch { }
        }

        string displayName = isDefaultVi
            ? a.Name
            : (hasValidDbAn ? anTr!.Title! : (hasEnAnimal ? enAn!.Name : a.Name));

        string? displayDescription = isDefaultVi
            ? a.Description
            : (hasValidDbAn && !string.IsNullOrWhiteSpace(anTr?.Description) && !LocalizationHelper.IsUntranslatedVietnamese(anTr.Description, a.Description, lang)
                ? anTr.Description
                : (hasEnAnimal ? enAn!.Description : null));

        string displaySpeciesName = a.Species == null
            ? string.Empty
            : (isDefaultVi ? a.Species.Name : (hasValidDbSp ? spTr!.Title! : (hasEnSpecies ? enSp!.Name : a.Species.Name)));

        string displayAreaName = a.Area == null
            ? string.Empty
            : (isDefaultVi ? a.Area.Name : (hasValidDbArea ? areaTr!.Title! : a.Area.Name));

        string? displayEncName = a.Enclosure == null
            ? null
            : (isDefaultVi ? a.Enclosure.Name : (hasValidDbEnc ? encTr!.Title! : (hasEnEnc ? enEnc!.Name : a.Enclosure.Name)));

        string? conservationStatus = hasEnSpecies
            ? enSp!.ConservationStatus
            : LocalizationHelper.LocalizeConservationStatus(a.Species?.ConservationStatus, lang);

        return new AnimalResponseDto
        {
            AnimalId = a.AnimalId,
            SpeciesId = a.SpeciesId,
            SpeciesName = displaySpeciesName,
            ScientificName = a.Species?.ScientificName,
            ConservationStatus = conservationStatus,
            AreaId = a.AreaId,
            AreaName = displayAreaName,
            EnclosureId = a.EnclosureId,
            EnclosureName = displayEncName,
            EnclosureCode = a.Enclosure?.Code,
            OriginalName = a.Name,
            Name = displayName,
            Description = displayDescription,
            LanguageCode = lang,
            HasTranslation = hasAnTr,
            ReferenceSource = anTr?.SourceReference ?? a.ReferenceSource ?? a.Species?.ReferenceSource,
            Gender = a.Gender.ToString(),
            DateOfBirth = a.DateOfBirth,
            Origin = origin,
            HealthStatus = healthStatus,
            ConservationNote = conservationNote,
            ImageUrl = a.ImageUrl,
            WeightKg = a.WeightKg,
            TemperatureC = a.TemperatureC,
            VeterinarianName = a.VeterinarianName,
            HealthActionRequired = a.HealthActionRequired,
            LastHealthCheckAt = a.LastHealthCheckAt,
            Habitat = habitat,
            Diet = diet,
            Lifespan = lifespan,
            Status = a.Status.ToString(),
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
    }
}
