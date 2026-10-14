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

    public LanguagesController(INarrationService narrationService)
    {
        _narrationService = narrationService;
    }

    /// <summary>
    /// Lấy danh sách ngôn ngữ hỗ trợ thuyết minh tự động
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<LanguageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLanguages()
    {
        var languages = await _narrationService.GetLanguagesAsync();
        return Ok(ApiResponse<IEnumerable<LanguageDto>>.Ok(languages));
    }
}
