using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ZooGuide.API.Filters;
using ZooGuide.Application.Interfaces;
using ZooGuide.Application.Services;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Repositories;
using ZooGuide.Infrastructure.Services;

// Load .env from current or parent directories if present
var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
while (dir != null)
{
    var envPath = Path.Combine(dir.FullName, ".env");
    if (File.Exists(envPath))
    {
        foreach (var line in File.ReadAllLines(envPath))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
            var sepIndex = trimmed.IndexOf('=');
            if (sepIndex <= 0) continue;
            var key = trimmed[..sepIndex].Trim();
            var val = trimmed[(sepIndex + 1)..].Trim().Trim('"');
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, val);
            }
        }
        break;
    }
    dir = dir.Parent;
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ZooGuide API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Ví dụ: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure JWT Authentication
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? AuthService.DefaultSecretKey;
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? AuthService.DefaultIssuer;
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? AuthService.DefaultAudience;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var principal = context.Principal;
            if (principal == null)
            {
                context.Fail("Không tìm thấy thông tin xác thực trong token.");
                return;
            }

            var userIdClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                context.Fail("Token không chứa định danh người dùng hợp lệ.");
                return;
            }

            // Kiểm tra giới hạn phiên tuyệt đối (Absolute Session Timeout: 8 giờ)
            var nowUtc = DateTime.UtcNow;
            var absExpTicksClaim = principal.FindFirst("abs_exp_ticks")?.Value;
            if (!string.IsNullOrWhiteSpace(absExpTicksClaim) && long.TryParse(absExpTicksClaim, out var absExpTicks))
            {
                if (nowUtc.Ticks >= absExpTicks)
                {
                    context.Fail("Phiên đăng nhập quản trị đã vượt quá thời hạn tối đa 8 giờ.");
                    return;
                }
            }

            if (context.SecurityToken != null)
            {
                var validFrom = context.SecurityToken.ValidFrom;
                if (validFrom != DateTime.MinValue &&
                    (nowUtc - validFrom.ToUniversalTime()) > TimeSpan.FromHours(AuthService.AdminAbsoluteSessionHours))
                {
                    context.Fail("Phiên đăng nhập quản trị đã vượt quá thời hạn tối đa 8 giờ.");
                    return;
                }
            }

            var dbContext = context.HttpContext.RequestServices.GetService<ZooGuideDbContext>();
            if (dbContext != null)
            {
                var user = await dbContext.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null || user.Status == ZooGuide.Domain.Enums.UserStatus.Locked)
                {
                    context.Fail("Tài khoản không tồn tại hoặc đã bị khóa.");
                    return;
                }

                if (user.Role != ZooGuide.Domain.Enums.UserRole.Admin &&
                    user.Role != ZooGuide.Domain.Enums.UserRole.Staff)
                {
                    context.Fail("Tài khoản không có quyền truy cập phân hệ quản trị.");
                    return;
                }

                // Kiểm tra thu hồi phiên sau khi Logout (lưu bền vững trong bảng USERS trên PostgreSQL)
                var loginTicksClaim = principal.FindFirst("login_ticks")?.Value;
                if (!string.IsNullOrWhiteSpace(loginTicksClaim) && long.TryParse(loginTicksClaim, out var loginTicks))
                {
                    if (!user.LastLoginAt.HasValue ||
                        (user.UpdatedAt.HasValue && user.UpdatedAt.Value.ToUniversalTime().Ticks > loginTicks))
                    {
                        context.Fail("Phiên làm việc đã kết thúc hoặc bị thu hồi.");
                        return;
                    }
                }
                else
                {
                    if (user.UpdatedAt.HasValue &&
                        (!user.LastLoginAt.HasValue || user.UpdatedAt.Value.ToUniversalTime() > user.LastLoginAt.Value.ToUniversalTime()))
                    {
                        context.Fail("Phiên làm việc đã đăng xuất.");
                        return;
                    }
                }
            }
        }
    };
});

// Application & Auth Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.ISpeciesService, ZooGuide.Infrastructure.Services.SpeciesService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.ITicketTypeService, ZooGuide.Infrastructure.Services.TicketTypeService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.ITicketService, ZooGuide.Infrastructure.Services.TicketService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.IEmailService, ZooGuide.Infrastructure.Services.SmtpEmailService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.IOrderService, ZooGuide.Infrastructure.Services.OrderService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.ITranslationService, ZooGuide.Infrastructure.Services.TranslationService>();
builder.Services.AddSingleton<ZooGuide.Application.Interfaces.ISupabaseStorageService, ZooGuide.Infrastructure.Services.SupabaseStorageService>();

// Configure EF Core with Supabase PostgreSQL (or bypass in Testing environment if not configured)
var envConnStr = Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING");
var cfgConnStr = builder.Configuration.GetConnectionString("DefaultConnection");
var connectionString = !string.IsNullOrWhiteSpace(envConnStr)
    ? envConnStr
    : (!string.IsNullOrWhiteSpace(cfgConnStr) ? cfgConnStr : null);

if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<ZooGuideDbContext>(options =>
    {
        options.UseNpgsql(connectionString, pgOptions =>
        {
            pgOptions.MigrationsAssembly(typeof(ZooGuideDbContext).Assembly.FullName);
        });
    });
}
else if (!builder.Environment.IsEnvironment("Testing"))
{
    throw new InvalidOperationException("Missing SUPABASE_CONNECTION_STRING or ConnectionStrings:DefaultConnection.");
}

// Register Repositories for Areas, Animals, Tickets, Enclosures
builder.Services.AddScoped<IAreaRepository, AreaRepository>();
builder.Services.AddScoped<IEnclosureRepository, EnclosureRepository>();
builder.Services.AddScoped<IAnimalRepository, AnimalRepository>();
builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<ITicketSessionRepository, TicketSessionRepository>();

// Register Application Services for Areas, Animals, Tickets, Enclosures
builder.Services.AddScoped<IAreaService, AreaService>();
builder.Services.AddScoped<IEnclosureService, EnclosureService>();
builder.Services.AddScoped<IAnimalService, AnimalService>();
builder.Services.AddScoped<ITicketSessionService, ZooGuide.Infrastructure.Services.TicketSessionService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.IDeviceTrackingService, ZooGuide.Infrastructure.Services.DeviceTrackingService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.IPoiService, ZooGuide.Infrastructure.Services.PoiService>();

// Register Services for Dashboard, Narration, Audit
builder.Services.AddSingleton<ZooGuide.Application.Interfaces.IOnlineUserTracker, ZooGuide.Infrastructure.Services.OnlineUserTracker>();
builder.Services.AddSingleton<ZooGuide.Application.Interfaces.IAuditLogService, ZooGuide.Infrastructure.Services.AuditLogService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.IDashboardService, ZooGuide.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.INarrationService, ZooGuide.Infrastructure.Services.NarrationService>();

// Register Session Filter
builder.Services.AddScoped<RequireTicketSessionFilter>();

// Configure CORS for web frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ZooGuide.API.Hubs.OnlineTrackerHub>("/hubs/online");
app.MapHub<ZooGuide.API.Hubs.OnlineTrackerHub>("/api/hubs/online");

// Lắng nghe sự kiện timeout dọn dẹp session để broadcast realtime tới Admin Dashboard
var onlineTracker = app.Services.GetRequiredService<ZooGuide.Application.Interfaces.IOnlineUserTracker>();
var trackerHubContext = app.Services.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<ZooGuide.API.Hubs.OnlineTrackerHub>>();

onlineTracker.OnCountsChanged += (activeBuyers, activeDevices) =>
{
    _ = Task.Run(async () =>
    {
        try
        {
            await trackerHubContext.Clients.Group("Admins").SendAsync("ActiveBuyersUpdated", new
            {
                activeTicketBuyers = activeBuyers,
                activeDevices = activeDevices,
                activeBuyerConnections = onlineTracker.GetActiveBuyerConnectionsCount()
            });
            await trackerHubContext.Clients.Group("Admins").SendAsync("ActiveDevicesUpdated", new
            {
                activeDevices = activeDevices
            });
            await trackerHubContext.Clients.Group("Admins").SendAsync("OnlineUsersUpdated", activeBuyers);
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Lỗi khi broadcast OnCountsChanged từ OnlineUserTracker");
        }
    });
};

// Health check / DB ping endpoint
app.MapGet("/api/health", async (ZooGuideDbContext dbContext) =>
{
    var canConnect = await dbContext.Database.CanConnectAsync();
    var userCount = canConnect ? await dbContext.Users.CountAsync() : 0;
    var animalCount = canConnect ? await dbContext.Animals.CountAsync(a => a.Status == ZooGuide.Domain.Enums.AnimalStatus.Active) : 0;
    var areaCount = canConnect ? await dbContext.Areas.CountAsync() : 0;
    var enclosureCount = canConnect ? await dbContext.Enclosures.CountAsync() : 0;
    var languageCount = canConnect ? await dbContext.Languages.CountAsync(l => l.IsActive) : 0;
    var speciesCount = canConnect ? await dbContext.Species.CountAsync() : 0;
    var narrationCount = canConnect ? await dbContext.Narrations.CountAsync() : 0;
    var audioCount = canConnect ? await dbContext.Audios.CountAsync() : 0;
    var translationCount = canConnect ? await dbContext.ContentTranslations.CountAsync() : 0;

    return Results.Ok(new
    {
        status = canConnect ? "Healthy" : "Degraded",
        databaseConnected = canConnect,
        timestamp = DateTime.UtcNow,
        counts = new
        {
            users = userCount,
            animals = animalCount,
            areas = areaCount,
            enclosures = enclosureCount,
            languages = languageCount,
            species = speciesCount,
            narrations = narrationCount,
            audios = audioCount,
            contentTranslations = translationCount
        }
    });
})
.WithName("HealthCheck")
.WithOpenApi();

// Seed initial data if development & ensure telemetry schema exists
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetService<ZooGuideDbContext>();
    if (dbContext != null)
    {
        try
        {
            if (dbContext.Database.IsRelational())
            {
                await dbContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""NARRATION_TELEMETRY_EVENTS"" (
                ""TelemetryEventId"" BIGSERIAL PRIMARY KEY,
                ""Category"" VARCHAR(40) NOT NULL,
                ""EventType"" VARCHAR(60) NOT NULL,
                ""InstallationId"" VARCHAR(128) NULL,
                ""SessionId"" UUID NULL,
                ""LanguageCode"" VARCHAR(16) NULL,
                ""TargetType"" VARCHAR(40) NULL,
                ""TargetId"" INT NULL,
                ""TargetCode"" VARCHAR(100) NULL,
                ""TargetName"" VARCHAR(255) NULL,
                ""TriggerSource"" VARCHAR(40) NULL,
                ""ListenDurationSeconds"" INT NULL,
                ""TotalDurationSeconds"" INT NULL,
                ""DistanceMeters"" NUMERIC(10, 2) NULL,
                ""AccuracyMeters"" NUMERIC(10, 2) NULL,
                ""IsSuccess"" BOOLEAN NOT NULL DEFAULT TRUE,
                ""ErrorCode"" VARCHAR(80) NULL,
                ""ErrorMessage"" TEXT NULL,
                ""CreatedAt"" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        ");
            }
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Không thể kiểm tra/khởi tạo bảng NARRATION_TELEMETRY_EVENTS lúc khởi động.");
        }

        if (app.Environment.IsDevelopment())
        {
            await ZooGuideDataSeeder.SeedAsync(dbContext);
        }
    }
}

app.Run();

public partial class Program { }
