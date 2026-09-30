using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class TicketSessionConfiguration : IEntityTypeConfiguration<TicketSession>
{
    public void Configure(EntityTypeBuilder<TicketSession> builder)
    {
        builder.ToTable("TICKET_SESSIONS");

        builder.HasKey(ts => ts.SessionId);
        builder.Property(ts => ts.SessionId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(ts => ts.TicketId)
            .IsRequired();

        // UserId nullable for anonymous visitors
        builder.Property(ts => ts.UserId)
            .IsRequired(false);

        builder.Property(ts => ts.StartedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(ts => ts.ExpiredAt)
            .IsRequired();

        builder.Property(ts => ts.EndedAt)
            .IsRequired(false);

        builder.Property(ts => ts.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(ts => ts.LastLatitude)
            .HasPrecision(9, 6)
            .IsRequired(false);

        builder.Property(ts => ts.LastLongitude)
            .HasPrecision(9, 6)
            .IsRequired(false);

        builder.Property(ts => ts.LastLocationAt)
            .IsRequired(false);

        // Relationships
        builder.HasOne(ts => ts.Ticket)
            .WithMany(t => t.TicketSessions)
            .HasForeignKey(ts => ts.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ts => ts.User)
            .WithMany(u => u.TicketSessions)
            .HasForeignKey(ts => ts.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(ts => ts.VisitHistories)
            .WithOne(vh => vh.Session)
            .HasForeignKey(vh => vh.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(ts => ts.LocationLogs)
            .WithOne(ll => ll.Session)
            .HasForeignKey(ll => ll.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(ts => ts.ChatSessions)
            .WithOne(cs => cs.TicketSession)
            .HasForeignKey(cs => cs.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Required indexes for performance and security lookups
        builder.HasIndex(ts => ts.TicketId).HasDatabaseName("IX_TicketSessions_TicketId");
        builder.HasIndex(ts => ts.UserId).HasDatabaseName("IX_TicketSessions_UserId");
        builder.HasIndex(ts => ts.Status).HasDatabaseName("IX_TicketSessions_Status");
        builder.HasIndex(ts => new { ts.TicketId, ts.Status }).HasDatabaseName("IX_TicketSessions_TicketId_Status");
    }
}
