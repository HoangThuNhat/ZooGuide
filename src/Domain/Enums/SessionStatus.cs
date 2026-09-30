namespace ZooGuide.Domain.Enums;

/// <summary>
/// Trạng thái phiên quét vé tham quan
/// </summary>
public enum SessionStatus
{
    Active = 1,
    Expired = 2,
    Ended = 3,
    Revoked = 4
}
