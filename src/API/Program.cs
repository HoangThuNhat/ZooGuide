using Microsoft.EntityFrameworkCore;
using ZooGuide.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure EF Core with SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=.;Database=ZooGuide;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;";

builder.Services.AddDbContext<ZooGuideDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.MigrationsAssembly(typeof(ZooGuideDbContext).Assembly.FullName);
    });
});

// Configure CORS for web frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
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
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Health check / DB ping endpoint
app.MapGet("/api/health", async (ZooGuideDbContext dbContext) =>
{
    var canConnect = await dbContext.Database.CanConnectAsync();
    var userCount = canConnect ? await dbContext.Users.CountAsync() : 0;
    var animalCount = canConnect ? await dbContext.Animals.CountAsync() : 0;
    var areaCount = canConnect ? await dbContext.Areas.CountAsync() : 0;

    return Results.Ok(new
    {
        status = "Healthy",
        databaseConnected = canConnect,
        timestamp = DateTime.UtcNow,
        counts = new
        {
            users = userCount,
            animals = animalCount,
            areas = areaCount
        }
    });
})
.WithName("HealthCheck")
.WithOpenApi();

// Seed initial data if development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ZooGuideDbContext>();
    await ZooGuideDataSeeder.SeedAsync(dbContext);
}

app.Run();
