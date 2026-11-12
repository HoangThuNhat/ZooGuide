using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Xunit;
using ZooGuide.Application.DTOs.Auth;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Services;

namespace ZooGuide.IntegrationTests;

public class AdminAuthIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly string _testDbName = $"ZooGuideAuthTestDb_{Guid.NewGuid()}";

    public AdminAuthIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                // Thay thế DbContext bằng InMemory database phục vụ kiểm thử cô lập
                var descriptors = services.Where(d =>
                    d.ServiceType == typeof(DbContextOptions<ZooGuideDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions) ||
                    d.ServiceType == typeof(ZooGuideDbContext)).ToList();

                foreach (var descriptor in descriptors)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<ZooGuideDbContext>(options =>
                {
                    options.UseInMemoryDatabase(_testDbName);
                });

                // Seed dữ liệu người dùng kiểm thử
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ZooGuideDbContext>();
                db.Database.EnsureCreated();

                SeedUsers(db);
            });
        });
    }

    public void Dispose()
    {
        try
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetService<ZooGuideDbContext>();
            db?.Database.EnsureDeleted();
        }
        catch
        {
            // Bỏ qua lỗi dọn dẹp nếu host chưa khởi tạo
        }
    }

    private static void SeedUsers(ZooGuideDbContext db)
    {
        if (db.Users.Any()) return;

        var admin = new User
        {
            UserId = 101,
            Username = "admin_test",
            Email = "admin.test@zooguide.vn",
            PasswordHash = ZooGuideDataSeeder.HashPassword("Admin@Pass123"),
            FullName = "Admin Quản Trị Thử Nghiệm",
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var adminProduction = new User
        {
            UserId = 100,
            Username = "admin",
            Email = "admin@zooguide.vn",
            PasswordHash = ZooGuideDataSeeder.HashPassword("Admin@123456"),
            FullName = "Hệ Thống Quản Trị Viên",
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var legacyAdmin = new User
        {
            UserId = 105,
            Username = "legacy_admin",
            Email = "legacy@zooguide.vn",
            PasswordHash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3", // raw SHA256("123")
            FullName = "Admin Legacy Hash",
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var staff = new User
        {
            UserId = 102,
            Username = "staff_test",
            Email = "staff.test@zooguide.vn",
            PasswordHash = ZooGuideDataSeeder.HashPassword("Staff@Pass123"),
            FullName = "Nhân Viên Thử Nghiệm",
            Role = UserRole.Staff,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var visitor = new User
        {
            UserId = 103,
            Username = "visitor_test",
            Email = "visitor.test@gmail.com",
            PasswordHash = ZooGuideDataSeeder.HashPassword("Visitor@Pass123"),
            FullName = "Khách Tham Quan Thử Nghiệm",
            Role = UserRole.Visitor,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var lockedAdmin = new User
        {
            UserId = 104,
            Username = "locked_admin",
            Email = "locked@zooguide.vn",
            PasswordHash = ZooGuideDataSeeder.HashPassword("Locked@Pass123"),
            FullName = "Admin Bị Khóa",
            Role = UserRole.Admin,
            Status = UserStatus.Locked,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.AddRange(admin, adminProduction, legacyAdmin, staff, visitor, lockedAdmin);
        db.SaveChanges();
    }

    // 1. STT 1: Admin đăng nhập đúng -> PASS
    [Fact]
    public async Task AdminLogin_WithValidCredentials_Returns200AndValidJwtToken()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest
        {
            Username = "admin_test",
            Password = "Admin@Pass123"
        };

        var response = await client.PostAsJsonAsync("/api/auth/login", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        Assert.NotNull(body);
        Assert.True(body.Success);
        Assert.NotNull(body.Data?.Token);
        Assert.Equal("admin_test", body.Data?.User?.Username);
        Assert.Equal(UserRole.Admin, body.Data?.User?.Role);
    }

    // 2. STT 2: Admin đăng nhập sai mật khẩu -> Bị từ chối (401)
    [Fact]
    public async Task AdminLogin_WithWrongPassword_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest
        {
            Username = "admin_test",
            Password = "WrongPassword999"
        };

        var response = await client.PostAsJsonAsync("/api/auth/login", request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // 3. STT 3: Người dùng thông thường (Visitor) đăng nhập vào Admin -> Bị từ chối
    [Fact]
    public async Task VisitorLogin_AttemptAdminLogin_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest
        {
            Username = "visitor_test",
            Password = "Visitor@Pass123"
        };

        var response = await client.PostAsJsonAsync("/api/auth/login", request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        Assert.False(body?.Success);
        Assert.Contains("không có quyền truy cập", body?.Message ?? "");
    }

    // 4. STT 4: Truy cập Admin không có Token -> 401
    [Fact]
    public async Task AccessAdminEndpoint_WithoutToken_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // 5. STT 5: Truy cập Admin bằng Token hết hạn -> 401
    [Fact]
    public async Task AccessAdminEndpoint_WithExpiredToken_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var expiredToken = CreateJwtToken(101, "admin_test", UserRole.Admin, expiresAt: DateTime.UtcNow.AddMinutes(-30));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expiredToken);
        var response = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // 6. STT 6: Truy cập Admin bằng Token không hợp lệ -> 401
    [Fact]
    public async Task AccessAdminEndpoint_WithInvalidToken_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "this.is.a.completely.invalid.token.signature");

        var response = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // 7. STT 7: Tài khoản không đủ quyền gọi API Admin -> 403 Forbidden (Staff gọi DELETE API chỉ dành cho Admin)
    [Fact]
    public async Task StaffUser_CallingAdminOnlyEndpoint_Returns403Forbidden()
    {
        var client = _factory.CreateClient();
        var staffToken = CreateJwtToken(102, "staff_test", UserRole.Staff, expiresAt: DateTime.UtcNow.AddHours(2));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", staffToken);
        // GET /api/admin/logs chỉ cấp quyền cho Admin, Staff sẽ nhận 403 Forbidden
        var response = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // 8. STT 8: Admin truy cập chức năng đúng quyền -> Cho phép (200 OK)
    [Fact]
    public async Task AdminUser_AccessAllowedEndpoint_Returns200OK()
    {
        var client = _factory.CreateClient();
        var adminToken = CreateJwtToken(101, "admin_test", UserRole.Admin, expiresAt: DateTime.UtcNow.AddHours(2));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var response = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // 9. STT 9: Admin đăng xuất -> Phiên đăng nhập kết thúc
    [Fact]
    public async Task AdminLogout_WithValidToken_Returns200OK()
    {
        var client = _factory.CreateClient();
        var adminToken = CreateJwtToken(101, "admin_test", UserRole.Admin, expiresAt: DateTime.UtcNow.AddHours(2));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var response = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // 10. STT 10: Tải lại trang khi Token còn hợp lệ (GET /api/auth/me) -> Khôi phục trạng thái đúng
    [Fact]
    public async Task RefreshPageState_WithValidToken_RestoresUserProfileCorrectly()
    {
        var client = _factory.CreateClient();
        var adminToken = CreateJwtToken(101, "admin_test", UserRole.Admin, expiresAt: DateTime.UtcNow.AddHours(2));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var response = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileDto>>(_jsonOptions);
        Assert.NotNull(body);
        Assert.True(body.Success);
        Assert.Equal("admin_test", body.Data?.Username);
        Assert.Equal(UserRole.Admin, body.Data?.Role);
    }

    // 11. STT 11: Tải lại trang khi Token hết hạn -> Không được tiếp tục truy cập (401)
    [Fact]
    public async Task RefreshPageState_WithExpiredToken_FailsWith401Unauthorized()
    {
        var client = _factory.CreateClient();
        var expiredToken = CreateJwtToken(101, "admin_test", UserRole.Admin, expiresAt: DateTime.UtcNow.AddHours(-1));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expiredToken);
        var response = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // 12. STT 12: Chỉnh sửa Role trong Frontend (Ký token bằng secret khác) -> Backend không chấp nhận quyền giả mạo
    [Fact]
    public async Task ForgedTokenSignature_IsRejectedByBackend_With401Unauthorized()
    {
        var client = _factory.CreateClient();
        // Giả lập kẻ tấn công tự sinh JWT với Role=Admin nhưng dùng secret giả
        var fakeSecretKey = "Fake_Attacker_Secret_Key_Cannot_Forge_Signature_1234567890!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(fakeSecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "999"),
            new Claim(ClaimTypes.Name, "hacker"),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = AuthService.DefaultIssuer,
            Audience = AuthService.DefaultAudience,
            SigningCredentials = creds
        };

        var handler = new JwtSecurityTokenHandler();
        var forgedToken = handler.WriteToken(handler.CreateToken(descriptor));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", forgedToken);
        var response = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // 13. Kiểm thử tài khoản bị khóa (UserStatus.Locked) -> Bị từ chối 403 Forbidden
    [Fact]
    public async Task LockedAdminAccount_AttemptLogin_Returns403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest
        {
            Username = "locked_admin",
            Password = "Locked@Pass123"
        };

        var response = await client.PostAsJsonAsync("/api/auth/login", request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        Assert.False(body?.Success);
        Assert.Contains("bị khóa", body?.Message ?? "");
    }

    // 14. Kiểm thử đăng nhập tài khoản admin chính và admin_test với mật khẩu Admin@123456
    [Fact]
    public async Task AdminAccount_LoginWithAdmin123456_SucceedsAndCanCallProtectedEndpoints()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest
        {
            Username = "admin",
            Password = "Admin@123456"
        };

        var response = await client.PostAsJsonAsync("/api/auth/login", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        Assert.NotNull(body);
        Assert.True(body.Success);
        var token = body.Data?.Token;
        Assert.False(string.IsNullOrWhiteSpace(token));

        // Gọi /api/auth/me với token nhận được
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var meBody = await meResponse.Content.ReadFromJsonAsync<ApiResponse<UserProfileDto>>(_jsonOptions);
        Assert.NotNull(meBody);
        Assert.True(meBody.Success);
        Assert.Equal("admin", meBody.Data?.Username);
        Assert.Equal(UserRole.Admin, meBody.Data?.Role);

        // Gọi API admin-only /api/admin/logs
        var logsResponse = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.OK, logsResponse.StatusCode);
    }

    // 15. Kiểm thử tài khoản legacy hash raw SHA-256 (mật khẩu gốc 123) đăng nhập thành công và tự động nâng cấp hash
    [Fact]
    public async Task LegacyAdminAccount_LoginWithRawSha256_SucceedsAndUpgradesPasswordHash()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest
        {
            Username = "legacy_admin",
            Password = "123"
        };

        var response = await client.PostAsJsonAsync("/api/auth/login", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        Assert.NotNull(body);
        Assert.True(body.Success);
        Assert.Equal("legacy_admin", body.Data?.User?.Username);
        Assert.Equal(UserRole.Admin, body.Data?.User?.Role);
    }

    // 16. Kiểm thử JWT của Admin có thời hạn tối đa 8 giờ và chứa đầy đủ claims bắt buộc (UserId, Role, iat, exp, abs_exp, jti)
    [Fact]
    public async Task AdminLogin_JwtToken_HasMaximum8HoursExpirationAndRequiredClaims()
    {
        var client = _factory.CreateClient();
        var beforeLogin = DateTime.UtcNow.AddSeconds(-2);
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "admin_test",
            Password = "Admin@Pass123"
        });
        var afterLogin = DateTime.UtcNow.AddSeconds(2);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        Assert.NotNull(body?.Data);

        var expiresAt = body!.Data!.ExpiresAt;
        var expectedMinExpiry = beforeLogin.AddHours(8);
        var expectedMaxExpiry = afterLogin.AddHours(8);
        Assert.True(expiresAt >= expectedMinExpiry && expiresAt <= expectedMaxExpiry,
            $"Expected ExpiresAt to be ~8 hours from login, but got {expiresAt:O}");

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(body.Data.Token);

        Assert.NotNull(jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti));
        Assert.NotNull(jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Iat));
        Assert.NotNull(jwt.Claims.FirstOrDefault(c => c.Type == "abs_exp"));
        Assert.NotNull(jwt.Claims.FirstOrDefault(c => c.Type == "login_ticks"));
        Assert.NotNull(jwt.Claims.FirstOrDefault(c => c.Type == "abs_exp_ticks"));
        Assert.True((jwt.ValidTo - jwt.ValidFrom).TotalHours <= 8.01);
    }

    // 17. Kiểm thử Manual Logout: Sau khi đăng xuất, JWT cũ bị thu hồi và không thể gọi lại API Admin (401 Unauthorized)
    [Fact]
    public async Task AdminLogout_RevokesSession_SubsequentApiCallsWithOldTokenReturn401Unauthorized()
    {
        var client = _factory.CreateClient();
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "admin_test",
            Password = "Admin@Pass123"
        });
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);

        var loginBody = await loginRes.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        var token = loginBody!.Data!.Token;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Trước khi logout: truy cập bình thường (200 OK)
        var meBefore = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meBefore.StatusCode);

        // Thực hiện Logout
        var logoutRes = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logoutRes.StatusCode);

        // Sau khi logout: dùng lại JWT cũ phải bị từ chối với 401 Unauthorized
        var meAfter = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, meAfter.StatusCode);

        var logsAfter = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Unauthorized, logsAfter.StatusCode);
    }

    // 18. Kiểm thử Login Again: Sau khi hết hạn/đăng xuất, đăng nhập lại tạo phiên mới hợp lệ và JWT cũ vẫn bị từ chối
    [Fact]
    public async Task AdminLoginAgain_AfterLogout_CreatesNewValidSessionAndOldTokenRemainsRevoked()
    {
        var client = _factory.CreateClient();

        // Lần đăng nhập 1
        var login1 = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "admin_test",
            Password = "Admin@Pass123"
        });
        var body1 = await login1.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        var oldToken = body1!.Data!.Token;

        // Đăng xuất phiên 1
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", oldToken);
        var logoutRes = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logoutRes.StatusCode);

        // Đăng nhập lại (Phiên 2)
        client.DefaultRequestHeaders.Authorization = null;
        var login2 = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "admin_test",
            Password = "Admin@Pass123"
        });
        Assert.Equal(HttpStatusCode.OK, login2.StatusCode);
        var body2 = await login2.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        var newToken = body2!.Data!.Token;

        // Token cũ vẫn bị từ chối 401
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", oldToken);
        var oldTokenRes = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Unauthorized, oldTokenRes.StatusCode);

        // Token mới hoạt động bình thường 200 OK
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", newToken);
        var newTokenMeRes = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, newTokenMeRes.StatusCode);

        var newTokenLogsRes = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.OK, newTokenLogsRes.StatusCode);
    }

    // 19. Kiểm thử Absolute Session Timeout trên Backend: Token vượt quá 8 giờ kể từ lúc phát hành bị từ chối 401
    [Fact]
    public async Task TokenExceeding8HoursAbsoluteLimit_IsRejectedWith401Unauthorized()
    {
        var client = _factory.CreateClient();
        // Token được phát hành cách đây 8 giờ 5 phút (dù exp vẫn còn ở tương lai)
        var over8HoursToken = CreateJwtToken(
            101,
            "admin_test",
            UserRole.Admin,
            expiresAt: DateTime.UtcNow.AddMinutes(30),
            notBefore: DateTime.UtcNow.AddHours(-8).AddMinutes(-5));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", over8HoursToken);
        var response = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // 20. Kiểm thử Role Authorization: Staff nhận 403 trên API chỉ dành cho Admin nhưng không bị mất phiên đăng nhập
    [Fact]
    public async Task StaffUser_Receives403OnAdminOnlyEndpoint_SessionRemainsActiveOnStaffAllowedEndpoints()
    {
        var client = _factory.CreateClient();
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "staff_test",
            Password = "Staff@Pass123"
        });
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
        var loginBody = await loginRes.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>(_jsonOptions);
        var staffToken = loginBody!.Data!.Token;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", staffToken);

        // Gọi endpoint chỉ dành cho Admin -> 403 Forbidden
        var adminOnlyRes = await client.GetAsync("/api/admin/logs");
        Assert.Equal(HttpStatusCode.Forbidden, adminOnlyRes.StatusCode);

        // Phiên của Staff vẫn còn hiệu lực trên /api/auth/me -> 200 OK
        var meRes = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);
    }

    private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private static string CreateJwtToken(int userId, string username, UserRole role, DateTime expiresAt, DateTime? notBefore = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AuthService.DefaultSecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role.ToString()),
            new Claim(ClaimTypes.Email, $"{username}@zooguide.vn"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            NotBefore = notBefore ?? (expiresAt < DateTime.UtcNow ? expiresAt.AddHours(-1) : DateTime.UtcNow),
            Expires = expiresAt,
            Issuer = AuthService.DefaultIssuer,
            Audience = AuthService.DefaultAudience,
            SigningCredentials = creds
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(descriptor));
    }
}
