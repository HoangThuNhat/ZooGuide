using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ZooGuide.Application.DTOs.Auth;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ZooGuideDbContext _context;
    private readonly IConfiguration _configuration;

    public const string DefaultSecretKey = "ZooGuide_Secret_Key_For_JWT_Authentication_Token_2026_Secure!";
    public const string DefaultIssuer = "ZooGuideAPI";
    public const string DefaultAudience = "ZooGuideClients";
    public const int AdminAbsoluteSessionHours = 8;
    public const int AdminInactivityTimeoutMinutes = 15;

    public AuthService(ZooGuideDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        var username = request.Username.Trim();
        var password = request.Password;

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Tên đăng nhập và mật khẩu không được để trống.");
        }

        // Tìm người dùng theo Username hoặc Email (không phân biệt chữ hoa thường)
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower() || u.Email.ToLower() == username.ToLower());

        if (user == null)
        {
            throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        // Xác minh mật khẩu bảo mật (hỗ trợ cả hash kèm salt hệ thống và raw SHA-256 legacy từ SQL seed)
        var saltedHash = ZooGuideDataSeeder.HashPassword(password);
        var rawHash = HashRaw(password);
        bool isPasswordValid = string.Equals(user.PasswordHash, saltedHash, StringComparison.OrdinalIgnoreCase)
                            || string.Equals(user.PasswordHash, rawHash, StringComparison.OrdinalIgnoreCase);

        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        // Tự động nâng cấp hash legacy raw SHA-256 sang salted hash bảo mật
        if (string.Equals(user.PasswordHash, rawHash, StringComparison.OrdinalIgnoreCase))
        {
            user.PasswordHash = saltedHash;
        }

        // Kiểm tra trạng thái tài khoản
        if (user.Status == UserStatus.Locked)
        {
            throw new InvalidOperationException("Tài khoản quản trị viên đã bị khóa. Vui lòng liên hệ ban quản trị hệ thống.");
        }

        // Kiểm tra phân quyền truy cập: Chỉ Admin hoặc Staff mới được cấp quyền quản trị
        if (user.Role != UserRole.Admin && user.Role != UserRole.Staff)
        {
            throw new UnauthorizedAccessException("Tài khoản không có quyền truy cập vào phân hệ quản trị viên.");
        }

        // Cập nhật thời điểm đăng nhập gần nhất (làm tròn mili-giây để đồng nhất giữa .NET và PostgreSQL TIMESTAMPTZ)
        var loginTime = TruncateToMillisecond(DateTime.UtcNow);
        if (user.UpdatedAt.HasValue && loginTime <= user.UpdatedAt.Value.ToUniversalTime())
        {
            loginTime = TruncateToMillisecond(user.UpdatedAt.Value.ToUniversalTime()).AddMilliseconds(1);
        }
        if (user.LastLoginAt.HasValue && loginTime <= user.LastLoginAt.Value.ToUniversalTime())
        {
            loginTime = TruncateToMillisecond(user.LastLoginAt.Value.ToUniversalTime()).AddMilliseconds(1);
        }

        user.LastLoginAt = loginTime;
        user.UpdatedAt = loginTime;
        await _context.SaveChangesAsync();

        // Tạo JWT Token với giới hạn phiên tuyệt đối tối đa 8 giờ kể từ lúc đăng nhập
        var tokenExpiry = loginTime.AddHours(AdminAbsoluteSessionHours);
        var token = GenerateJwtToken(user, loginTime, tokenExpiry);

        var profile = new UserProfileDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            Status = user.Status,
            LastLoginAt = user.LastLoginAt
        };

        return new LoginResponse
        {
            Token = token,
            TokenType = "Bearer",
            ExpiresAt = tokenExpiry,
            User = profile
        };
    }

    public async Task<UserProfileDto?> GetCurrentUserProfileAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        return new UserProfileDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            Status = user.Status,
            LastLoginAt = user.LastLoginAt
        };
    }

    public async Task<bool> LogoutAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        var logoutTime = TruncateToMillisecond(DateTime.UtcNow);
        if (user.LastLoginAt.HasValue && logoutTime <= user.LastLoginAt.Value.ToUniversalTime())
        {
            logoutTime = TruncateToMillisecond(user.LastLoginAt.Value.ToUniversalTime()).AddMilliseconds(1);
        }
        if (user.UpdatedAt.HasValue && logoutTime <= user.UpdatedAt.Value.ToUniversalTime())
        {
            logoutTime = TruncateToMillisecond(user.UpdatedAt.Value.ToUniversalTime()).AddMilliseconds(1);
        }

        user.UpdatedAt = logoutTime;
        await _context.SaveChangesAsync();
        return true;
    }

    private string GenerateJwtToken(User user, DateTime issuedAt, DateTime expiresAt)
    {
        var secretKey = _configuration["Jwt:SecretKey"] 
            ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
            ?? DefaultSecretKey;
        var issuer = _configuration["Jwt:Issuer"] ?? DefaultIssuer;
        var audience = _configuration["Jwt:Audience"] ?? DefaultAudience;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var iatUnix = new DateTimeOffset(issuedAt).ToUnixTimeSeconds();
        var absExpUnix = new DateTimeOffset(expiresAt).ToUnixTimeSeconds();

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("FullName", user.FullName ?? string.Empty),
            new Claim("Status", user.Status.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, iatUnix.ToString(), ClaimValueTypes.Integer64),
            new Claim("abs_exp", absExpUnix.ToString(), ClaimValueTypes.Integer64),
            new Claim("login_ticks", issuedAt.Ticks.ToString()),
            new Claim("abs_exp_ticks", expiresAt.Ticks.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            NotBefore = issuedAt,
            IssuedAt = issuedAt,
            Expires = expiresAt,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static DateTime TruncateToMillisecond(DateTime dt)
    {
        var utc = dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime();
        return new DateTime(utc.Ticks - (utc.Ticks % TimeSpan.TicksPerMillisecond), DateTimeKind.Utc);
    }

    private static string HashRaw(string password)
    {
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
