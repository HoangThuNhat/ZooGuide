using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;
using ZooGuide.API.Filters;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PoisController : ControllerBase
{
    private readonly IPoiService _poiService;
    private readonly ISupabaseStorageService? _storageService;

    public PoisController(IPoiService poiService, ISupabaseStorageService? storageService = null)
    {
        _poiService = poiService;
        _storageService = storageService;
    }

    /// <summary>
    /// Lấy danh sách điểm tham quan (POI) có hỗ trợ tìm kiếm, lọc phân loại và kiểm định tọa độ
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PoiDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PoiFilterDto filter)
    {
        var list = await _poiService.GetAllAsync(filter);
        return Ok(ApiResponse<IEnumerable<PoiDto>>.Ok(list));
    }

    /// <summary>
    /// Lấy thông tin chi tiết một điểm tham quan theo ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PoiDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PoiDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var poi = await _poiService.GetByIdAsync(id);
        if (poi == null)
        {
            return NotFound(ApiResponse<PoiDto>.Fail($"Không tìm thấy điểm tham quan ID = {id}"));
        }
        return Ok(ApiResponse<PoiDto>.Ok(poi));
    }

    /// <summary>
    /// Tạo mới một điểm tham quan
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PoiDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PoiDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePoiDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(ApiResponse<PoiDto>.Fail("Tên điểm tham quan không được để trống."));
        }
        if (dto.RadiusMeters < 0)
{
    return BadRequest(
        ApiResponse<PoiDto>.Fail("Bán kính POI không được âm."));
}

        try
        {
            var created = await _poiService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.PoiId }, ApiResponse<PoiDto>.Ok(created, "Tạo điểm tham quan thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<PoiDto>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PoiDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Cập nhật thông tin điểm tham quan
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PoiDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PoiDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePoiDto dto)
    {
        var updated = await _poiService.UpdateAsync(id, dto);
        if (updated == null)
        {
            return NotFound(ApiResponse<PoiDto>.Fail($"Không tìm thấy điểm tham quan ID = {id}"));
        }
        return Ok(ApiResponse<PoiDto>.Ok(updated, "Cập nhật điểm tham quan thành công."));
    }

    /// <summary>
    /// Bật/tắt trạng thái hoạt động của điểm tham quan
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromQuery] bool isActive)
    {
        var success = await _poiService.UpdateStatusAsync(id, isActive);
        if (!success)
        {
            return NotFound(ApiResponse<bool>.Fail($"Không tìm thấy điểm tham quan ID = {id}"));
        }
        return Ok(ApiResponse<bool>.Ok(true, $"Đã {(isActive ? "kích hoạt" : "hạ xuống/tạm dừng")} điểm tham quan."));
    }

    /// <summary>
    /// Xác nhận kiểm định tọa độ địa lý WGS84 thực tế
    /// </summary>
    [HttpPatch("{id:int}/verify-coordinates")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyCoordinates(int id, [FromBody] VerifyCoordinatesRequest request)
    {
        var success = await _poiService.VerifyCoordinatesAsync(id, request.IsVerified, request.VerificationSource);
        if (!success)
        {
            return NotFound(ApiResponse<bool>.Fail($"Không tìm thấy điểm tham quan ID = {id}"));
        }
        return Ok(ApiResponse<bool>.Ok(true, request.IsVerified ? "Tọa độ đã được đánh dấu xác thực." : "Đã hủy trạng thái xác thực tọa độ."));
    }

    /// <summary>
    /// Xóa điểm tham quan
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _poiService.DeleteAsync(id);
        if (!success)
        {
            return NotFound(ApiResponse<bool>.Fail($"Không tìm thấy điểm tham quan ID = {id}"));
        }
        return Ok(ApiResponse<bool>.Ok(true, "Đã xóa điểm tham quan và các bài thuyết minh liên kết."));
    }

    // --- NARRATION & AUDIO MANAGEMENT ---

    /// <summary>
    /// Danh sách bài thuyết minh đa ngôn ngữ của điểm tham quan
    /// </summary>
    [HttpGet("{id:int}/narrations")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PoiNarrationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNarrations(int id)
    {
        var list = await _poiService.GetNarrationsAsync(id);
        return Ok(ApiResponse<IEnumerable<PoiNarrationDto>>.Ok(list));
    }

    /// <summary>
    /// Thêm mới bài thuyết minh theo ngôn ngữ cho điểm tham quan
    /// </summary>
    [HttpPost("{id:int}/narrations")]
    [ProducesResponseType(typeof(ApiResponse<PoiNarrationDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PoiNarrationDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddNarration(int id, [FromBody] CreatePoiNarrationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(ApiResponse<PoiNarrationDto>.Fail("Tiêu đề và nội dung thuyết minh không được để trống."));
        }

        try
        {
            var created = await _poiService.AddNarrationAsync(id, dto);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<PoiNarrationDto>.Ok(created, "Thêm bài thuyết minh thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PoiNarrationDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Cập nhật nội dung hoặc trạng thái bài thuyết minh
    /// </summary>
    [HttpPut("{id:int}/narrations/{narrationId:int}")]
    [ProducesResponseType(typeof(ApiResponse<PoiNarrationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PoiNarrationDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateNarration(int id, int narrationId, [FromBody] UpdatePoiNarrationDto dto)
    {
        var updated = await _poiService.UpdateNarrationAsync(narrationId, dto);
        if (updated == null)
        {
            return NotFound(ApiResponse<PoiNarrationDto>.Fail($"Không tìm thấy bài thuyết minh ID = {narrationId}"));
        }
        return Ok(ApiResponse<PoiNarrationDto>.Ok(updated, "Cập nhật bài thuyết minh thành công."));
    }

    /// <summary>
    /// Xóa bài thuyết minh
    /// </summary>
    [HttpDelete("{id:int}/narrations/{narrationId:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNarration(int id, int narrationId)
    {
        var success = await _poiService.DeleteNarrationAsync(narrationId);
        if (!success)
        {
            return NotFound(ApiResponse<bool>.Fail($"Không tìm thấy bài thuyết minh ID = {narrationId}"));
        }
        return Ok(ApiResponse<bool>.Ok(true, "Đã xóa bài thuyết minh."));
    }

    /// <summary>
    /// Upload file âm thanh (MP3 / WAV) cho bài thuyết minh POI vào Supabase Storage
    /// </summary>
    [HttpPost("{id:int}/narrations/{narrationId:int}/audio")]
    [ProducesResponseType(typeof(ApiResponse<PoiNarrationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PoiNarrationDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<PoiNarrationDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadNarrationAudio(int id, int narrationId, IFormFile audioFile)
    {
        if (audioFile == null || audioFile.Length == 0)
        {
            return BadRequest(ApiResponse<PoiNarrationDto>.Fail("Vui lòng chọn file âm thanh hợp lệ (MP3, WAV, AAC, M4A)."));
        }

        var ext = Path.GetExtension(audioFile.FileName).ToLowerInvariant();
        var allowedExts = new[] { ".mp3", ".wav", ".m4a", ".aac", ".ogg" };
        if (!allowedExts.Contains(ext))
        {
            return BadRequest(ApiResponse<PoiNarrationDto>.Fail("Định dạng file không được hỗ trợ. Vui lòng tải lên file âm thanh (.mp3, .wav, .m4a)."));
        }

        using var stream = audioFile.OpenReadStream();
        var updated = await _poiService.UploadNarrationAudioAsync(narrationId, stream, audioFile.FileName, audioFile.ContentType);
        if (updated == null)
        {
            return NotFound(ApiResponse<PoiNarrationDto>.Fail($"Không tìm thấy bài thuyết minh ID = {narrationId}"));
        }

        return Ok(ApiResponse<PoiNarrationDto>.Ok(updated, "Tải lên và liên kết file âm thanh thuyết minh thành công!"));
    }

    /// <summary>
    /// Lấy thông tin thuyết minh địa điểm dành cho khách tham quan (kèm cơ chế ngôn ngữ dự phòng)
    /// YÊU CẦU: Khách tham quan phải có TicketSession hợp lệ
    /// </summary>
    [HttpGet("{id:int}/public-narration")]
    [RequireTicketSession]
    [ProducesResponseType(typeof(ApiResponse<PoiPublicNarrationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PoiPublicNarrationDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<PoiPublicNarrationDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublicNarration(int id, [FromQuery] string? lang = "vi")
    {
        var data = await _poiService.GetPublicNarrationAsync(id, lang ?? "vi");
        if (data == null)
        {
            return NotFound(ApiResponse<PoiPublicNarrationDto>.Fail($"Không tìm thấy điểm tham quan ID = {id}"));
        }
        return Ok(ApiResponse<PoiPublicNarrationDto>.Ok(data));
    }

    /// <summary>
    /// Stream file âm thanh thuyết minh điểm tham quan có kiểm soát quyền truy cập theo TicketSession
    /// YÊU CẦU: Khách tham quan phải có TicketSession hợp lệ (?sessionId=... hoặc header X-Session-Id)
    /// </summary>
    [HttpGet("{id:int}/stream")]
    [HttpHead("{id:int}/stream")]
    [RequireTicketSession]
    public async Task<IActionResult> StreamAudio(int id, [FromQuery] string? lang = "vi")
    {
        var narration = await _poiService.GetPublicNarrationAsync(id, lang ?? "vi");
        if (narration == null || !narration.HasAudio || string.IsNullOrWhiteSpace(narration.AudioUrl))
        {
            return NotFound(ApiResponse<object>.Fail($"Chưa có file âm thanh thuyết minh cho điểm tham quan ID = {id} với ngôn ngữ '{lang}'."));
        }

        var audioUrl = narration.AudioUrl;
        var mimeType = "audio/mpeg";
        string? resolvedFilePath = null;

        if (_storageService != null)
        {
            resolvedFilePath = _storageService.ResolvePhysicalAudioPath(audioUrl, null);
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

        if (resolvedFilePath != null && System.IO.File.Exists(resolvedFilePath))
        {
            return PhysicalFile(resolvedFilePath, mimeType, enableRangeProcessing: true);
        }

        if (!string.IsNullOrWhiteSpace(audioUrl) && audioUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return Redirect(audioUrl);
        }

        return NotFound(ApiResponse<object>.Fail("File âm thanh thuyết minh POI không tồn tại trên hệ thống lưu trữ."));
    }
}

public class VerifyCoordinatesRequest
{
    public bool IsVerified { get; set; } = true;
    public string? VerificationSource { get; set; }
}
