using Microsoft.EntityFrameworkCore;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Data;

/// <summary>
/// ZooGuideDbContext: Central DbContext serving as the Single Source of Truth for ZooGuide.
/// Covers Core Domain (Users, Tickets, Sessions, Animals, Narrations, Audios)
/// and Extended Systems (Locations, Loyalty, Chatbot).
/// </summary>
public class ZooGuideDbContext : DbContext
{
    public ZooGuideDbContext(DbContextOptions<ZooGuideDbContext> options) : base(options)
    {
    }

    // Core Domain Sets
    public virtual DbSet<User> Users => Set<User>();
    public virtual DbSet<TicketType> TicketTypes => Set<TicketType>();
    public virtual DbSet<Ticket> Tickets => Set<Ticket>();
    public virtual DbSet<TicketSession> TicketSessions => Set<TicketSession>();
    public virtual DbSet<Species> Species => Set<Species>();
    public virtual DbSet<Area> Areas => Set<Area>();
    public virtual DbSet<Enclosure> Enclosures => Set<Enclosure>();
    public virtual DbSet<Animal> Animals => Set<Animal>();
    public virtual DbSet<Language> Languages => Set<Language>();
    public virtual DbSet<ContentTranslation> ContentTranslations => Set<ContentTranslation>();
    public virtual DbSet<Narration> Narrations => Set<Narration>();
    public virtual DbSet<Audio> Audios => Set<Audio>();
    public virtual DbSet<VisitHistory> VisitHistories => Set<VisitHistory>();

    // Extended Sets
    public virtual DbSet<LocationLog> LocationLogs => Set<LocationLog>();
    public virtual DbSet<MembershipLevel> MembershipLevels => Set<MembershipLevel>();
    public virtual DbSet<UserLoyalty> UserLoyalties => Set<UserLoyalty>();
    public virtual DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public virtual DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations in Infrastructure assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ZooGuideDbContext).Assembly);
    }
}
