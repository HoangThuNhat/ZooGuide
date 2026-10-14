namespace ZooGuide.Application.Interfaces;

public interface IGuestChatLimiterService
{
    (int usedCount, int remaining, bool isLimitReached) GetQuota(string guestId);
    (bool allowed, int remaining, string message) TryConsume(string guestId, string? message);
    void ResetQuota(string guestId);
}
