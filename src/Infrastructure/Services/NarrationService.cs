using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class NarrationService : INarrationService
{
    private readonly ZooGuideDbContext _context;

    public NarrationService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<NarrationResponseDto>> GetAllAsync(NarrationFilterDto? filter = null)
    {
        var query = _context.Narrations
            .Include(n => n.Animal)
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Include(n => n.Audios)
            .AsNoTracking()
            .AsQueryable();

        if (filter != null)
        {
            if (filter.AnimalId.HasValue)
            {
                query = query.Where(n => n.AnimalId == filter.AnimalId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.LanguageCode))
            {
                var lang = TranslationService.NormalizeLanguageCode(filter.LanguageCode);
                query = query.Where(n => n.Language.Code.ToLower() == lang);
            }

            if (!string.IsNullOrWhiteSpace(filter.Status))
            {
                if (Enum.TryParse<NarrationStatus>(filter.Status, true, out var statusEnum))
                {
                    query = query.Where(n => n.Status == statusEnum);
                }
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.Trim().ToLower();
                query = query.Where(n => n.Title.ToLower().Contains(s) || 
                                         n.Content.ToLower().Contains(s) || 
                                         n.Animal.Name.ToLower().Contains(s));
            }
        }

        var list = await query
            .OrderByDescending(n => n.UpdatedAt ?? n.CreatedAt)
            .ToListAsync();

        var animalTranslations = await _context.ContentTranslations
            .Where(ct => ct.EntityType == "Animal" && ct.IsPublished)
            .AsNoTracking()
            .ToListAsync();

        return list.Select(n => MapToDto(n, animalTranslations));
    }

    public async Task<NarrationResponseDto?> GetByIdAsync(int id)
    {
        var narration = await _context.Narrations
            .Include(n => n.Animal)
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Include(n => n.Audios)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.NarrationId == id);

        if (narration == null) return null;

        var animalTranslations = await _context.ContentTranslations
            .Where(ct => ct.EntityType == "Animal" && ct.EntityId == narration.AnimalId && ct.IsPublished)
            .AsNoTracking()
            .ToListAsync();

        return MapToDto(narration, animalTranslations);
    }

    public async Task<NarrationResponseDto?> GetByAnimalAndLanguageAsync(int animalId, string languageCode)
    {
        var lang = TranslationService.NormalizeLanguageCode(languageCode);
        var narration = await _context.Narrations
            .Include(n => n.Animal)
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Include(n => n.Audios)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.AnimalId == animalId && n.Language.Code.ToLower() == lang && n.Status == NarrationStatus.Published);

        if (narration == null) return null;

        var animalTranslations = await _context.ContentTranslations
            .Where(ct => ct.EntityType == "Animal" && ct.EntityId == animalId && ct.LanguageCode.ToLower() == lang && ct.IsPublished)
            .AsNoTracking()
            .ToListAsync();

        return MapToDto(narration, animalTranslations);
    }

    public async Task<NarrationResponseDto?> GetBySpeciesAndLanguageAsync(int speciesId, string languageCode)
    {
        var lang = TranslationService.NormalizeLanguageCode(languageCode);
        var narration = await _context.Narrations
            .Include(n => n.Animal)
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Include(n => n.Audios)
            .AsNoTracking()
            .FirstOrDefaultAsync(n =>
                n.Animal.SpeciesId == speciesId &&
                n.Animal.Status != AnimalStatus.Transferred &&
                n.Language.Code.ToLower() == lang &&
                n.Status == NarrationStatus.Published);

        if (narration == null)
        {
            // Không âm thầm lấy bài thuyết minh ngôn ngữ khác khi thiếu bản dịch!
            return null;
        }

        var animalTranslations = await _context.ContentTranslations
            .Where(ct => ct.EntityType == "Animal" && ct.EntityId == narration.AnimalId && ct.LanguageCode.ToLower() == lang && ct.IsPublished)
            .AsNoTracking()
            .ToListAsync();

        return MapToDto(narration, animalTranslations);
    }

    public async Task<NarrationResponseDto> CreateAsync(CreateNarrationDto dto)
    {
        var animal = await _context.Animals.FindAsync(dto.AnimalId);
        if (animal == null)
        {
            throw new ArgumentException($"Không tìm thấy động vật với ID = {dto.AnimalId}");
        }

        var language = await _context.Languages.FindAsync(dto.LanguageId);
        if (language == null)
        {
            throw new ArgumentException($"Không tìm thấy ngôn ngữ với ID = {dto.LanguageId}");
        }

        // Kiểm tra trùng lặp AnimalId + LanguageId
        var existing = await _context.Narrations
            .AnyAsync(n => n.AnimalId == dto.AnimalId && n.LanguageId == dto.LanguageId);

        if (existing)
        {
            throw new InvalidOperationException($"Bài thuyết minh cho động vật '{animal.Name}' với ngôn ngữ '{language.Name}' đã tồn tại.");
        }

        // Lấy admin user mặc định nếu không truyền
        int creatorId = dto.CreatedBy ?? (await _context.Users.Select(u => u.UserId).FirstOrDefaultAsync());
        if (creatorId == 0) creatorId = 1;

        if (!Enum.TryParse<NarrationStatus>(dto.Status, true, out var statusEnum))
        {
            statusEnum = NarrationStatus.Published;
        }

        var narration = new Narration
        {
            AnimalId = dto.AnimalId,
            LanguageId = dto.LanguageId,
            Title = dto.Title,
            Content = dto.Content,
            AudioUrl = dto.AudioUrl,
            DurationSeconds = dto.DurationSeconds,
            Status = statusEnum,
            ReferenceSource = dto.ReferenceSource,
            CreatedBy = creatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Narrations.Add(narration);
        await _context.SaveChangesAsync();

        // Nếu có AudioUrl thì tự động thêm record vào bảng Audios
        if (!string.IsNullOrWhiteSpace(dto.AudioUrl))
        {
            var audio = new Audio
            {
                NarrationId = narration.NarrationId,
                FileUrl = dto.AudioUrl,
                FileName = Path.GetFileName(dto.AudioUrl) ?? "narration_audio.mp3",
                MimeType = "audio/mpeg",
                DurationSeconds = dto.DurationSeconds,
                LanguageCode = language.Code,
                Status = AudioStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            _context.Audios.Add(audio);
            await _context.SaveChangesAsync();
        }

        return (await GetByIdAsync(narration.NarrationId))!;
    }

    public async Task<NarrationResponseDto?> UpdateAsync(int id, UpdateNarrationDto dto)
    {
        var narration = await _context.Narrations
            .Include(n => n.Audios)
            .FirstOrDefaultAsync(n => n.NarrationId == id);

        if (narration == null) return null;

        narration.Title = dto.Title;
        narration.Content = dto.Content;
        if (!string.IsNullOrWhiteSpace(dto.AudioUrl))
        {
            narration.AudioUrl = dto.AudioUrl;
        }
        if (dto.DurationSeconds.HasValue)
        {
            narration.DurationSeconds = dto.DurationSeconds.Value;
        }
        if (!string.IsNullOrWhiteSpace(dto.ReferenceSource))
        {
            narration.ReferenceSource = dto.ReferenceSource;
        }
        if (Enum.TryParse<NarrationStatus>(dto.Status, true, out var statusEnum))
        {
            narration.Status = statusEnum;
        }
        narration.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> UpdateStatusAsync(int id, string status)
    {
        var narration = await _context.Narrations.FindAsync(id);
        if (narration == null) return false;

        if (Enum.TryParse<NarrationStatus>(status, true, out var statusEnum))
        {
            narration.Status = statusEnum;
            narration.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        return false;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var narration = await _context.Narrations
            .Include(n => n.Audios)
            .FirstOrDefaultAsync(n => n.NarrationId == id);

        if (narration == null) return false;

        _context.Audios.RemoveRange(narration.Audios);
        _context.Narrations.Remove(narration);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AudioResponseDto?> AddAudioAsync(
        int narrationId,
        string fileUrl,
        string fileName,
        string mimeType,
        int? durationSeconds,
        long? fileSize,
        string? storageBucket = null,
        string? objectPath = null,
        string? publicUrl = null,
        string? languageCode = null,
        string? voiceName = null,
        string? ttsProvider = null,
        string? sha256Hash = null,
        bool isVerified = false)
    {
        var narration = await _context.Narrations
            .Include(n => n.Language)
            .FirstOrDefaultAsync(n => n.NarrationId == narrationId);
        if (narration == null) return null;

        var audio = new Audio
        {
            NarrationId = narrationId,
            FileUrl = fileUrl,
            FileName = fileName,
            MimeType = mimeType,
            DurationSeconds = durationSeconds ?? narration.DurationSeconds,
            FileSize = fileSize,
            StorageBucket = storageBucket ?? "narration-audio",
            ObjectPath = objectPath,
            PublicUrl = publicUrl,
            LanguageCode = languageCode ?? narration.Language?.Code,
            VoiceName = voiceName,
            TtsProvider = ttsProvider,
            Sha256Hash = sha256Hash,
            IsVerified = isVerified,
            Status = AudioStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _context.Audios.Add(audio);
        narration.AudioUrl = fileUrl;
        if (durationSeconds.HasValue)
        {
            narration.DurationSeconds = durationSeconds.Value;
        }
        narration.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapAudioToDto(audio);
    }

    public async Task<IEnumerable<LanguageDto>> GetLanguagesAsync()
    {
        var languages = await _context.Languages
            .Where(l => l.IsActive)
            .OrderBy(l => l.DisplayOrder)
            .ThenBy(l => l.LanguageId)
            .AsNoTracking()
            .ToListAsync();

        return languages.Select(l => new LanguageDto
        {
            LanguageId = l.LanguageId,
            Code = l.Code,
            Name = l.Name,
            NativeName = string.IsNullOrWhiteSpace(l.NativeName) ? l.Name : l.NativeName,
            Locale = l.Locale,
            FlagIcon = l.FlagIcon,
            TtsVoice = l.TtsVoice,
            DisplayOrder = l.DisplayOrder,
            IsActive = l.IsActive
        });
    }

    private static NarrationResponseDto MapToDto(Narration n, List<ContentTranslation>? animalTranslations = null)
    {
        var langCode = n.Language?.Code ?? "vi";
        var animalTr = animalTranslations?.FirstOrDefault(ct =>
            ct.EntityId == n.AnimalId &&
            string.Equals(ct.LanguageCode, langCode, StringComparison.OrdinalIgnoreCase));

        var orderedAudios = n.Audios?
            .OrderByDescending(a => a.Status == AudioStatus.Active)
            .ThenByDescending(a => a.IsVerified)
            .ThenByDescending(a => a.CreatedAt)
            .Select(MapAudioToDto)
            .ToList() ?? new List<AudioResponseDto>();

        var primaryAudio = orderedAudios.FirstOrDefault();

        return new NarrationResponseDto
        {
            NarrationId = n.NarrationId,
            AnimalId = n.AnimalId,
            AnimalName = animalTr != null && !string.IsNullOrWhiteSpace(animalTr.Title)
                ? animalTr.Title
                : (n.Animal?.Name ?? string.Empty),
            AnimalImageUrl = n.Animal?.ImageUrl,
            LanguageId = n.LanguageId,
            LanguageCode = langCode,
            LanguageName = !string.IsNullOrWhiteSpace(n.Language?.NativeName)
                ? n.Language.NativeName
                : (n.Language?.Name ?? string.Empty),
            Title = n.Title,
            Content = n.Content,
            AudioUrl = primaryAudio?.FileUrl ?? n.AudioUrl,
            DurationSeconds = primaryAudio?.DurationSeconds ?? n.DurationSeconds,
            Status = n.Status.ToString(),
            ReferenceSource = n.ReferenceSource,
            CreatedBy = n.CreatedBy,
            CreatorName = n.Creator?.FullName ?? "Cán bộ chuyên môn",
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt,
            Audios = orderedAudios
        };
    }

    private static AudioResponseDto MapAudioToDto(Audio a) => new()
    {
        AudioId = a.AudioId,
        NarrationId = a.NarrationId,
        FileUrl = a.FileUrl,
        FileName = a.FileName,
        MimeType = a.MimeType,
        DurationSeconds = a.DurationSeconds,
        FileSize = a.FileSize,
        StorageBucket = a.StorageBucket,
        ObjectPath = a.ObjectPath,
        PublicUrl = a.PublicUrl,
        LanguageCode = a.LanguageCode,
        VoiceName = a.VoiceName,
        TtsProvider = a.TtsProvider,
        Sha256Hash = a.Sha256Hash,
        IsVerified = a.IsVerified,
        Status = a.Status.ToString(),
        CreatedAt = a.CreatedAt
    };
}
