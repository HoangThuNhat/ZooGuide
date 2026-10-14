using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbotService;

    public ChatbotController(IChatbotService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    /// <summary>
    /// Gửi câu hỏi đến ZooBot — Trợ lý ảo sử dụng dữ liệu thực tế từ cơ sở dữ liệu
    /// </summary>
    [HttpPost("message")]
    [ProducesResponseType(typeof(ApiResponse<ChatbotQueryResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendMessage([FromBody] ChatbotQueryRequestDto request)
    {
        var response = await _chatbotService.ProcessMessageAsync(request);
        return Ok(ApiResponse<ChatbotQueryResponseDto>.Ok(response));
    }
}
