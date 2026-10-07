using Microsoft.EntityFrameworkCore;
using ZooGuide.API.Filters;
using ZooGuide.Application.Interfaces;
using ZooGuide.Application.Services;
using ZooGuide.Infrastructure.Data;
using ZooGuide.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Application Services
builder.Services.AddScoped<ZooGuide.Application.Interfaces.ISpeciesService, ZooGuide.Infrastructure.Services.SpeciesService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.ITicketTypeService, ZooGuide.Infrastructure.Services.TicketTypeService>();
builder.Services.AddScoped<ZooGuide.Application.Interfaces.ITicketService, ZooGuide.Infrastructure.Services.TicketService>();

// Configure EF Core with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=postgres;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ZooGuideDbContext>(options =>
{
    options.UseNpgsql(connectionString, pgOptions =>
    {
        pgOptions.MigrationsAssembly(typeof(ZooGuideDbContext).Assembly.FullName);
    });
});

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
builder.Services.AddScoped<ITicketSessionService, TicketSessionService>();

// Register Session Filter
builder.Services.AddScoped<RequireTicketSessionFilter>();

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
    var enclosureCount = canConnect ? await dbContext.Enclosures.CountAsync() : 0;

    return Results.Ok(new
    {
        status = "Healthy",
        databaseConnected = canConnect,
        timestamp = DateTime.UtcNow,
        counts = new
        {
            users = userCount,
            animals = animalCount,
            areas = areaCount,
            enclosures = enclosureCount
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
