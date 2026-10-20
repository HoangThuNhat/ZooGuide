using Microsoft.AspNetCore.Mvc;
using ZooGuide.API.Filters;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NarrationsController : ControllerBase
{
    private readonly INarrationService _narrationService;
    private readonly IAuditLogService _auditLogService;
    private readonly ISupabaseStorageService? _storageService;

    public NarrationsController(
        INarrationService narrationService,
        IAuditLogService auditLogService,
        ISupabaseStorageService? storageService = null)
    {
        _narrationService = narrationService;
        _auditLogService = auditLogService;
        _storageService = storageService;
    }

    /// <summary>
    /// Lấy danh sách bài thuyết minh (hỗ trợ lọc theo animalId, languageCode, status, search)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<NarrationResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] NarrationFilterDto filter)
    {
        var narrations = await _narrationService.GetAllAsync(filter);
        return Ok(ApiResponse<IEnumerable<NarrationResponseDto>>.Ok(narrations));
    }

    /// <summary>
    /// Lấy chi tiết bài thuyết minh theo ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var narration = await _narrationService.GetByIdAsync(id);
        if (narration == null)
        {
            return NotFound(ApiResponse<NarrationResponseDto>.Fail($"Không tìm thấy bài thuyết minh ID = {id}."));
        }
        return Ok(ApiResponse<NarrationResponseDto>.Ok(narration));
    }

    /// <summary>
    /// Lấy bài thuyết minh chính thức theo AnimalId và ngôn ngữ (vi, en, zh, ja, ko, th, fr, es, de, ru, pt, id...)
    /// YÊU CẦU: Khách tham quan phải có TicketSession hợp lệ
    /// </summary>
    [HttpGet("animal/{animalId:int}")]
    [RequireTicketSession]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByAnimal(int animalId, [FromQuery] string lang = "vi")
    {
        var narration = await _narrationService.GetByAnimalAndLanguageAsync(animalId, lang);
        if (narration == null)
        {
            return NotFound(ApiResponse<NarrationResponseDto>.Fail($"Chưa có bài thuyết minh cho động vật ID = {animalId} với ngôn ngữ '{lang}'."));
        }
        return Ok(ApiResponse<NarrationResponseDto>.Ok(narration));
    }

    /// <summary>
    /// Lấy bài thuyết minh chính thức theo SpeciesId và ngôn ngữ (vi, en, zh, ja, ko, th, fr, es, de, ru, pt, id...)
    /// YÊU CẦU: Khách tham quan phải có TicketSession hợp lệ
    /// </summary>
    [HttpGet("species/{speciesId:int}")]
    [RequireTicketSession]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySpecies(int speciesId, [FromQuery] string lang = "vi")
    {
        var narration = await _narrationService.GetBySpeciesAndLanguageAsync(speciesId, lang);
        if (narration == null)
        {
            return NotFound(ApiResponse<NarrationResponseDto>.Fail($"Chưa có bài thuyết minh cho loài ID = {speciesId} với ngôn ngữ '{lang}'."));
        }
        return Ok(ApiResponse<NarrationResponseDto>.Ok(narration));
    }

    /// <summary>
    /// Stream file âm thanh thuyết minh có kiểm soát quyền truy cập (Không dùng file giả dự phòng)
    /// YÊU CẦU: Khách tham quan phải có TicketSession hợp lệ (?sessionId=... hoặc header)
    /// </summary>
    [HttpGet("{id:int}/stream")]
    [RequireTicketSession]
    public async Task<IActionResult> StreamAudio(int id)
    {
        var narration = await _narrationService.GetByIdAsync(id);
        if (narration == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy bài thuyết minh ID = {id}."));
        }

        if (!string.Equals(narration.Status, "Published", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Bài thuyết minh này chưa được phê duyệt xuất bản."));
        }

        var primaryAudio = narration.Audios?
            .OrderByDescending(a => string.Equals(a.Status, "Active", StringComparison.OrdinalIgnoreCase))
            .ThenByDescending(a => a.IsVerified)
            .ThenByDescending(a => a.CreatedAt)
            .FirstOrDefault();

        var audioUrl = primaryAudio?.FileUrl ?? narration.AudioUrl;
        var mimeType = primaryAudio?.MimeType ?? "audio/mpeg";
        string? resolvedFilePath = null;

        if (_storageService != null)
        {
            resolvedFilePath = _storageService.ResolvePhysicalAudioPath(audioUrl, primaryAudio?.ObjectPath);
        }

        if (resolvedFilePath == null && !string.IsNullOrWhiteSpace(audioUrl) && !audioUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var cleanUrl = audioUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var candidate = Path.Combine(webRoot, cleanUrl);
            if (System.IO.File.Exists(candidate))
            {
                resolvedFilePath = candidate;
            }
        }

        // TUYỆT ĐỐI KHÔNG fallback sang generic_vi.mp3 hay file âm thanh ngôn ngữ khác!
        if (resolvedFilePath == null || !System.IO.File.Exists(resolvedFilePath))
        {
            return NotFound(ApiResponse<object>.Fail($"File âm thanh thuyết minh cho ngôn ngữ '{narration.LanguageCode}' không tồn tại trên hệ thống lưu trữ."));
        }

        return PhysicalFile(resolvedFilePath, mimeType, enableRangeProcessing: true);
    }

    /// <summary>
    /// Thêm bài thuyết minh mới
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateNarrationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(ApiResponse<NarrationResponseDto>.Fail("Tiêu đề và nội dung thuyết minh không được để trống."));
        }

        try
        {
            var created = await _narrationService.CreateAsync(dto);
            _auditLogService.Log("CREATE", "Narration", created.NarrationId.ToString(), $"Tạo bài thuyết minh '{created.Title}' cho động vật ID={dto.AnimalId}");
            return CreatedAtAction(nameof(GetById), new { id = created.NarrationId }, ApiResponse<NarrationResponseDto>.Ok(created, "Thêm bài thuyết minh thành công!"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<NarrationResponseDto>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<NarrationResponseDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Cập nhật bài thuyết minh
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<NarrationResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateNarrationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(ApiResponse<NarrationResponseDto>.Fail("Tiêu đề và nội dung thuyết minh không được để trống."));
        }

        var updated = await _narrationService.UpdateAsync(id, dto);
        if (updated == null)
        {
            return NotFound(ApiResponse<NarrationResponseDto>.Fail($"Không tìm thấy bài thuyết minh ID = {id}."));
        }

        _auditLogService.Log("UPDATE", "Narration", id.ToString(), $"Cập nhật bài thuyết minh '{updated.Title}'");
        return Ok(ApiResponse<NarrationResponseDto>.Ok(updated, "Cập nhật bài thuyết minh thành công!"));
    }

    /// <summary>
    /// Thay đổi trạng thái bài thuyết minh (Draft / Published / Archived)
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateNarrationStatusDto dto)
    {
        var success = await _narrationService.UpdateStatusAsync(id, dto.Status);
        if (!success)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy bài thuyết minh ID = {id} hoặc trạng thái không hợp lệ."));
        }

        _auditLogService.Log("UPDATE_STATUS", "Narration", id.ToString(), $"Đổi trạng thái thuyết minh sang {dto.Status}");
        return Ok(ApiResponse<object>.Ok(new { id, status = dto.Status }, $"Đã cập nhật trạng thái bài thuyết minh sang: {dto.Status}"));
    }

    /// <summary>
    /// Xóa bài thuyết minh
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _narrationService.DeleteAsync(id);
        if (!success)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy bài thuyết minh ID = {id}."));
        }

        _auditLogService.Log("DELETE", "Narration", id.ToString(), $"Xóa bài thuyết minh ID={id}");
        return Ok(ApiResponse<object>.Ok(new { id }, "Đã xóa bài thuyết minh thành công."));
    }

    /// <summary>
    /// Thêm thông tin file audio liên kết với bài thuyết minh
    /// </summary>
    [HttpPost("{id:int}/audio")]
    [ProducesResponseType(typeof(ApiResponse<AudioResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddAudio(int id, [FromBody] AudioResponseDto audioDto)
    {
        var audio = await _narrationService.AddAudioAsync(
            id, 
            audioDto.FileUrl, 
            string.IsNullOrWhiteSpace(audioDto.FileName) ? "audio.mp3" : audioDto.FileName, 
            string.IsNullOrWhiteSpace(audioDto.MimeType) ? "audio/mpeg" : audioDto.MimeType, 
            audioDto.DurationSeconds, 
            audioDto.FileSize
        );

        if (audio == null)
        {
            return NotFound(ApiResponse<AudioResponseDto>.Fail($"Không tìm thấy bài thuyết minh ID = {id}."));
        }

        _auditLogService.Log("ADD_AUDIO", "Narration", id.ToString(), $"Liên kết file audio {audio.FileName} vào bài thuyết minh");
        return Ok(ApiResponse<AudioResponseDto>.Ok(audio, "Thêm file âm thanh thành công!"));
    }

    /// <summary>
    /// Tải lên file âm thanh thực tế cho bài thuyết minh (hỗ trợ .mp3, .wav, .ogg, .m4a, .aac)
    /// Lưu trữ vật lý tại wwwroot/uploads/audio và ghi nhận metadata vào CSDL
    /// </summary>
    [HttpPost("{id:int}/upload-audio")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<AudioResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AudioResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AudioResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadAudio(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<AudioResponseDto>.Fail("Vui lòng chọn file âm thanh để tải lên."));
        }

        // Kiểm tra định dạng file âm thanh hợp lệ
        var allowedExtensions = new[] { ".mp3", ".wav", ".ogg", ".m4a", ".aac" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(ApiResponse<AudioResponseDto>.Fail($"Định dạng file không được hỗ trợ ({extension}). Chỉ chấp nhận: .mp3, .wav, .ogg, .m4a, .aac."));
        }

        // Giới hạn dung lượng tối đa 25MB
        if (file.Length > 25 * 1024 * 1024)
        {
            return BadRequest(ApiResponse<AudioResponseDto>.Fail("Dung lượng file vượt quá giới hạn cho phép (tối đa 25MB)."));
        }

        var narration = await _narrationService.GetByIdAsync(id);
        if (narration == null)
        {
            return NotFound(ApiResponse<AudioResponseDto>.Fail($"Không tìm thấy bài thuyết minh ID = {id}."));
        }

        var langCode = string.IsNullOrWhiteSpace(narration.LanguageCode) ? "vi" : narration.LanguageCode.ToLowerInvariant();
        var safeFileName = $"animal_{narration.AnimalId}_{langCode}_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}{extension}";
        var objectPath = $"{langCode}/{safeFileName}";
        var mimeType = file.ContentType ?? (extension == ".mp3" ? "audio/mpeg" : "audio/wav");

        SupabaseStorageUploadResult uploadResult;
        if (_storageService != null)
        {
            using var inputStream = file.OpenReadStream();
            uploadResult = await _storageService.UploadAudioAsync(inputStream, objectPath, mimeType);
        }
        else
        {
            // Fallback khi chạy unit test không truyền ISupabaseStorageService
            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsDir = Path.Combine(webRoot, "uploads", "audio");
            if (!Directory.Exists(uploadsDir))
            {
                Directory.CreateDirectory(uploadsDir);
            }
            var filePath = Path.Combine(uploadsDir, safeFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            uploadResult = new SupabaseStorageUploadResult
            {
                StorageBucket = "narration-audio",
                ObjectPath = objectPath,
                FileUrl = $"/uploads/audio/{safeFileName}",
                PublicUrl = $"/uploads/audio/{safeFileName}",
                SizeBytes = file.Length
            };
        }

        var audio = await _narrationService.AddAudioAsync(
            id,
            uploadResult.FileUrl,
            file.FileName,
            mimeType,
            null,
            file.Length,
            uploadResult.StorageBucket,
            uploadResult.ObjectPath,
            uploadResult.PublicUrl,
            langCode,
            "Uploaded-Studio",
            "ManualUpload",
            uploadResult.Sha256Hash,
            true
        );

        if (audio == null)
        {
            return NotFound(ApiResponse<AudioResponseDto>.Fail($"Không tìm thấy bài thuyết minh ID = {id}."));
        }

        _auditLogService.Log("UPLOAD_AUDIO", "Narration", id.ToString(), $"Upload file âm thanh thực tế: {file.FileName} ({file.Length / 1024} KB) -> {uploadResult.ObjectPath}");
        return Ok(ApiResponse<AudioResponseDto>.Ok(audio, "Tải file âm thanh lên máy chủ thành công!"));
    }
}
