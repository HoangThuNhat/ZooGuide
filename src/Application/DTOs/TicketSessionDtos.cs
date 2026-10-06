using System.ComponentModel.DataAnnotations;

namespace ZooGuide.Application.DTOs;

/// <summary>
/// Request DTO xác thực mã vé từ khách du lịch
/// </summary>
public class ValidateTicketRequestDto
{
    [Required(ErrorMessage = "Vui lòng nhập mã vé hợp lệ")]
    public string TicketCode { get; set; } = string.Empty;

    public string? Device { get; set; }
}

/// <summary>
/// DTO thông tin phiên tham quan trả về cho client
/// </summary>
public class TicketSessionDto
{
    public string SessionId { get; set; } = string.Empty;
    public string TicketCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = "Khách tham quan";
    public string TicketType { get; set; } = string.Empty;
    public string ValidDate { get; set; } = string.Empty;
    public List<string> ZonesAllowed { get; set; } = new() { "ALL" };
    public bool HasAudioGuide { get; set; } = true;
    public string ActivatedAt { get; set; } = string.Empty;
    public string ExpiresAt { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string? Device { get; set; }
}

/// <summary>
/// Response DTO cho thao tác quét/xác thực vé
/// </summary>
public class TicketValidationResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public TicketSessionDto? Session { get; set; }

    public static TicketValidationResponseDto Ok(TicketSessionDto session, string message = "Xác thực vé thành công! Phiên tham quan đã được mở khóa.") =>
        new() { Success = true, Message = message, Session = session };

    public static TicketValidationResponseDto Fail(string message, string? errorCode = null) =>
        new() { Success = false, Message = message, ErrorCode = errorCode };
}
