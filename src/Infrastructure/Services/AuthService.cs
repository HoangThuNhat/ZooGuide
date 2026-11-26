using System;
using System.Collections.Concurrent;
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

    // Lưu trạng thái thu hồi JWT theo jti cho môi trường triển khai 1 Backend instance hiện tại
    private static readonly ConcurrentDictionary<string, DateTime> _revokedTokens = new(StringComparer.Ordinal);

    public const string DefaultSecretKey = "ZooGuide_Secret_Key_For_JWT_Authentication_Token_2026_Secure!";
    public const string DefaultIssuer = "ZooGuideAPI";
    public const string DefaultAudience = "ZooGuideClients";
    public const int AdminAbsoluteSessionHours = 8;
    public const int AdminInactivityTimeoutMinutes = 15;
    public const int AdminPasswordExpirationHours = 24;

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
        bool passwordHashUpgraded = false;
        if (string.Equals(user.PasswordHash, rawHash, StringComparison.OrdinalIgnoreCase))
        {
            user.PasswordHash = saltedHash;
            passwordHashUpgraded = true;
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

        // Cập nhật thời điểm đăng nhập gần nhất (không dùng User.UpdatedAt hoặc LastLoginAt để tính tuổi mật khẩu)
        var loginTime = TruncateToMillisecond(DateTime.UtcNow);
        user.LastLoginAt = loginTime;

        // Backfill PasswordChangedAt từ CreatedAt cho tài khoản quản trị cũ nếu chưa có
        if (!user.PasswordChangedAt.HasValue)
        {
            user.PasswordChangedAt = EnsureUtc(user.CreatedAt);
        }

        if (passwordHashUpgraded)
        {
            user.UpdatedAt = loginTime;
        }
        await _context.SaveChangesAsync();

        bool mustChangePassword = IsPasswordExpired(user.PasswordChangedAt, user.CreatedAt, loginTime);

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
            LastLoginAt = user.LastLoginAt,
            PasswordChangedAt = user.PasswordChangedAt,
            MustChangePassword = mustChangePassword
        };

        return new LoginResponse
        {
            Token = token,
            TokenType = "Bearer",
            ExpiresAt = tokenExpiry,
            MustChangePassword = mustChangePassword,
            User = profile
        };
    }

    public async Task<UserProfileDto?> GetCurrentUserProfileAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        bool isAdminOrStaff = user.Role == UserRole.Admin || user.Role == UserRole.Staff;
        if (isAdminOrStaff && !user.PasswordChangedAt.HasValue)
        {
            user.PasswordChangedAt = EnsureUtc(user.CreatedAt);
            await _context.SaveChangesAsync();
        }

        bool mustChangePassword = isAdminOrStaff && IsPasswordExpired(user.PasswordChangedAt, user.CreatedAt);

        return new UserProfileDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            Status = user.Status,
            LastLoginAt = user.LastLoginAt,
            PasswordChangedAt = user.PasswordChangedAt,
            MustChangePassword = mustChangePassword
        };
    }

    public async Task<ChangePasswordResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            throw new ArgumentException("Vui lòng nhập mật khẩu hiện tại.");

        if (string.IsNullOrWhiteSpace(request.NewPassword))
            throw new ArgumentException("Vui lòng nhập mật khẩu mới.");

        if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
            throw new ArgumentException("Vui lòng nhập xác nhận mật khẩu mới.");

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            throw new ArgumentException("Mật khẩu mới và xác nhận mật khẩu không khớp.");

        if (request.NewPassword.Length < 6)
            throw new ArgumentException("Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.");

        if (string.Equals(request.CurrentPassword, request.NewPassword, StringComparison.Ordinal))
            throw new ArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
            throw new UnauthorizedAccessException("Không tìm thấy thông tin tài khoản người dùng.");

        if (user.Status == UserStatus.Locked)
            throw new InvalidOperationException("Tài khoản đã bị khóa.");

        if (user.Role != UserRole.Admin && user.Role != UserRole.Staff)
            throw new UnauthorizedAccessException("Chỉ tài khoản quản trị (Admin/Staff) mới được phép sử dụng chức năng này.");

        // Xác minh mật khẩu hiện tại
        var currentSaltedHash = ZooGuideDataSeeder.HashPassword(request.CurrentPassword);
        var currentRawHash = HashRaw(request.CurrentPassword);
        bool isCurrentValid = string.Equals(user.PasswordHash, currentSaltedHash, StringComparison.OrdinalIgnoreCase)
                           || string.Equals(user.PasswordHash, currentRawHash, StringComparison.OrdinalIgnoreCase);

        if (!isCurrentValid)
        {
            throw new ArgumentException("Mật khẩu hiện tại không chính xác.");
        }

        // Kiểm tra mật khẩu mới không trùng với hash mật khẩu hiện tại trong DB
        var newSaltedHash = ZooGuideDataSeeder.HashPassword(request.NewPassword);
        var newRawHash = HashRaw(request.NewPassword);
        if (string.Equals(user.PasswordHash, newSaltedHash, StringComparison.OrdinalIgnoreCase)
            || string.Equals(user.PasswordHash, newRawHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }

        var changedTime = TruncateToMillisecond(DateTime.UtcNow);
        user.PasswordHash = newSaltedHash;
        user.PasswordChangedAt = changedTime;
        user.UpdatedAt = changedTime;

        await _context.SaveChangesAsync();

        var profile = new UserProfileDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            Status = user.Status,
            LastLoginAt = user.LastLoginAt,
            PasswordChangedAt = user.PasswordChangedAt,
            MustChangePassword = false
        };

        return new ChangePasswordResponse
        {
            PasswordChangedAt = changedTime,
            MustChangePassword = false,
            User = profile
        };
    }

    public bool IsPasswordExpired(DateTime? passwordChangedAt, DateTime createdAt, DateTime? nowUtc = null)
    {
        var effectiveChangedAt = EnsureUtc(passwordChangedAt ?? createdAt);
        var referenceNow = EnsureUtc(nowUtc ?? DateTime.UtcNow);
        var expirationHours = AdminPasswordExpirationHours;
        var configuredHours = _configuration["Auth:AdminPasswordExpirationHours"];
        if (!string.IsNullOrWhiteSpace(configuredHours) &&
            int.TryParse(configuredHours, out var parsedHours) &&
            parsedHours > 0)
        {
            expirationHours = parsedHours;
        }
        return (referenceNow - effectiveChangedAt) >= TimeSpan.FromHours(expirationHours);
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        };
    }

    public async Task<bool> LogoutAsync(int userId, string? jti = null, DateTime? tokenExpiresAtUtc = null)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return false;

        var nowUtc = DateTime.UtcNow;
        PruneExpiredRevokedTokens(nowUtc);

        if (!string.IsNullOrWhiteSpace(jti))
        {
            var expiryUtc = tokenExpiresAtUtc.HasValue && tokenExpiresAtUtc.Value.ToUniversalTime() > nowUtc
                ? tokenExpiresAtUtc.Value.ToUniversalTime()
                : nowUtc.AddHours(AdminAbsoluteSessionHours);

            _revokedTokens[jti.Trim()] = expiryUtc;
        }

        return true;
    }

    public bool IsTokenRevoked(string? jti)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return false;
        }

        var normalizedJti = jti.Trim();
        if (_revokedTokens.TryGetValue(normalizedJti, out var expiresAtUtc))
        {
            if (expiresAtUtc > DateTime.UtcNow)
            {
                return true;
            }

            _revokedTokens.TryRemove(normalizedJti, out _);
        }

        return false;
    }

    private static void PruneExpiredRevokedTokens(DateTime nowUtc)
    {
        foreach (var entry in _revokedTokens)
        {
            if (entry.Value <= nowUtc)
            {
                _revokedTokens.TryRemove(entry.Key, out _);
            }
        }
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
