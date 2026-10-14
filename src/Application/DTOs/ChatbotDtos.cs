namespace ZooGuide.Application.DTOs;

public class ChatbotQueryRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? SessionId { get; set; }
}

public class ChatbotQueryResponseDto
{
    public string Reply { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public bool FoundData { get; set; }
    public string? SourceType { get; set; } // "Animal" | "Area" | "Species" | "Narration" | "Faq" | "NotFound"
    public object? RelatedData { get; set; }
    public bool HasValidTicket { get; set; }
    public int RemainingQuestions { get; set; }
    public int MaxQuestions { get; set; }
    public bool IsLimitReached { get; set; }
}

public class ChatbotStatusResponseDto
{
    public bool HasValidTicket { get; set; }
    public int RemainingQuestions { get; set; }
    public int MaxQuestions { get; set; }
    public bool IsLimitReached { get; set; }
    public string Message { get; set; } = string.Empty;
}
