using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface IChatbotService
{
    Task<ChatbotQueryResponseDto> ProcessMessageAsync(ChatbotQueryRequestDto request);
}
