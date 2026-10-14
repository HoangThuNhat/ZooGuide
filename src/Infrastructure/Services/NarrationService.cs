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
                var lang = filter.LanguageCode.Trim().ToLower();
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

        return list.Select(MapToDto);
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

        return narration == null ? null : MapToDto(narration);
    }

    public async Task<NarrationResponseDto?> GetByAnimalAndLanguageAsync(int animalId, string languageCode)
    {
        var lang = languageCode.Trim().ToLower();
        var narration = await _context.Narrations
            .Include(n => n.Animal)
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Include(n => n.Audios)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.AnimalId == animalId && n.Language.Code.ToLower() == lang && n.Status == NarrationStatus.Published);

        return narration == null ? null : MapToDto(narration);
    }

    public async Task<NarrationResponseDto?> GetBySpeciesAndLanguageAsync(int speciesId, string languageCode)
    {
        var lang = languageCode.Trim().ToLower();
        var narration = await _context.Narrations
            .Include(n => n.Animal)
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Include(n => n.Audios)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Animal.SpeciesId == speciesId && n.Language.Code.ToLower() == lang && n.Status == NarrationStatus.Published);

        if (narration != null)
        {
            return MapToDto(narration);
        }

        // Fallback: any published narration for this species
        var fallback = await _context.Narrations
            .Include(n => n.Animal)
            .Include(n => n.Language)
            .Include(n => n.Creator)
            .Include(n => n.Audios)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Animal.SpeciesId == speciesId && n.Status == NarrationStatus.Published);

        return fallback == null ? null : MapToDto(fallback);
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

    public async Task<AudioResponseDto?> AddAudioAsync(int narrationId, string fileUrl, string fileName, string mimeType, int? durationSeconds, long? fileSize)
    {
        var narration = await _context.Narrations.FindAsync(narrationId);
        if (narration == null) return null;

        var audio = new Audio
        {
            NarrationId = narrationId,
            FileUrl = fileUrl,
            FileName = fileName,
            MimeType = mimeType,
            DurationSeconds = durationSeconds,
            FileSize = fileSize,
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

        return new AudioResponseDto
        {
            AudioId = audio.AudioId,
            NarrationId = audio.NarrationId,
            FileUrl = audio.FileUrl,
            FileName = audio.FileName,
            MimeType = audio.MimeType,
            DurationSeconds = audio.DurationSeconds,
            FileSize = audio.FileSize,
            Status = audio.Status.ToString(),
            CreatedAt = audio.CreatedAt
        };
    }

    public async Task<IEnumerable<LanguageDto>> GetLanguagesAsync()
    {
        var languages = await _context.Languages
            .Where(l => l.IsActive)
            .AsNoTracking()
            .ToListAsync();

        return languages.Select(l => new LanguageDto
        {
            LanguageId = l.LanguageId,
            Code = l.Code,
            Name = l.Name,
            IsActive = l.IsActive
        });
    }

    private static NarrationResponseDto MapToDto(Narration n)
    {
        return new NarrationResponseDto
        {
            NarrationId = n.NarrationId,
            AnimalId = n.AnimalId,
            AnimalName = n.Animal?.Name ?? string.Empty,
            AnimalImageUrl = n.Animal?.ImageUrl,
            LanguageId = n.LanguageId,
            LanguageCode = n.Language?.Code ?? string.Empty,
            LanguageName = n.Language?.Name ?? string.Empty,
            Title = n.Title,
            Content = n.Content,
            AudioUrl = n.AudioUrl,
            DurationSeconds = n.DurationSeconds,
            Status = n.Status.ToString(),
            CreatedBy = n.CreatedBy,
            CreatorName = n.Creator?.FullName ?? "Cán bộ chuyên môn",
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt,
            Audios = n.Audios?.Select(a => new AudioResponseDto
            {
                AudioId = a.AudioId,
                NarrationId = a.NarrationId,
                FileUrl = a.FileUrl,
                FileName = a.FileName,
                MimeType = a.MimeType,
                DurationSeconds = a.DurationSeconds,
                FileSize = a.FileSize,
                Status = a.Status.ToString(),
                CreatedAt = a.CreatedAt
            }).ToList() ?? new List<AudioResponseDto>()
        };
    }
}
