using System;
using System.Threading.Tasks;
using ZooGuide.Application.DTOs.Auth;

namespace ZooGuide.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserProfileDto?> GetCurrentUserProfileAsync(int userId);
    Task<ChangePasswordResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<bool> LogoutAsync(int userId, string? jti = null, DateTime? tokenExpiresAtUtc = null);
    bool IsTokenRevoked(string? jti);
    bool IsPasswordExpired(DateTime? passwordChangedAt, DateTime createdAt, DateTime? nowUtc = null);
}
