using System.Threading.Tasks;
using ZooGuide.Application.DTOs.Auth;

namespace ZooGuide.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserProfileDto?> GetCurrentUserProfileAsync(int userId);
    Task<bool> LogoutAsync(int userId);
}
