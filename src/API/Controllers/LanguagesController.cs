using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LanguagesController : ControllerBase
{
    private readonly INarrationService _narrationService;
    private readonly ITranslationService? _translationService;

    public LanguagesController(INarrationService narrationService, ITranslationService? translationService = null)
    {
        _narrationService = narrationService;
        _translationService = translationService;
    }

    /// <summary>
    /// Lấy danh sách ngôn ngữ hỗ trợ thuyết minh tự động và giao diện
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<LanguageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLanguages()
    {
        var languages = await _narrationService.GetLanguagesAsync();
        return Ok(ApiResponse<IEnumerable<LanguageDto>>.Ok(languages));
    }

    /// <summary>
    /// Lấy từ điển nhãn giao diện cho một ngôn ngữ cụ thể từ Supabase
    /// </summary>
    [HttpGet("{code}/ui")]
    [ProducesResponseType(typeof(ApiResponse<Dictionary<string, string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUiDictionary(string code)
    {
        if (_translationService == null)
            return Ok(ApiResponse<Dictionary<string, string>>.Ok(new Dictionary<string, string>()));

        var dict = await _translationService.GetUiTranslationsAsync(code);
        return Ok(ApiResponse<Dictionary<string, string>>.Ok(dict));
    }

    /// <summary>
    /// Lấy danh sách bản dịch theo loại đối tượng và ngôn ngữ
    /// </summary>
    [HttpGet("translations")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ContentTranslationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTranslations([FromQuery] string? lang = null, [FromQuery] string? entityType = null, [FromQuery] int? entityId = null)
    {
        if (_translationService == null)
            return Ok(ApiResponse<IEnumerable<ContentTranslationDto>>.Ok(Enumerable.Empty<ContentTranslationDto>()));

        var items = await _translationService.GetTranslationsAsync(lang, entityType, entityId);
        return Ok(ApiResponse<IEnumerable<ContentTranslationDto>>.Ok(items));
    }

    /// <summary>
    /// Tạo mới hoặc cập nhật bản dịch trong Supabase
    /// </summary>
    [HttpPost("translations")]
    [ProducesResponseType(typeof(ApiResponse<ContentTranslationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpsertTranslation([FromBody] UpsertContentTranslationDto dto)
    {
        if (_translationService == null)
            return StatusCode(500, ApiResponse<string>.Fail("Translation service unavailable"));

        var result = await _translationService.UpsertTranslationAsync(dto);
        return Ok(ApiResponse<ContentTranslationDto>.Ok(result, "Cập nhật bản dịch thành công."));
    }
}
