using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("TICKETS");

        builder.HasKey(t => t.TicketId);
        builder.Property(t => t.TicketId).UseIdentityColumn();

        builder.Property(t => t.TicketCode)
            .IsRequired()
            .HasMaxLength(50);
        builder.HasIndex(t => t.TicketCode)
            .IsUnique()
            .HasDatabaseName("UQ_Tickets_TicketCode");

        builder.Property(t => t.TicketTypeId)
            .IsRequired();

        builder.Property(t => t.IssuedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(t => t.ValidFrom)
            .IsRequired();

        builder.Property(t => t.ValidUntil)
            .IsRequired();

        builder.Property(t => t.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(t => t.UsedAt)
            .IsRequired(false);

        builder.Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(t => t.UpdatedAt)
            .IsRequired(false);

        // Relationships
        builder.HasOne(t => t.TicketType)
            .WithMany(tt => tt.Tickets)
            .HasForeignKey(t => t.TicketTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.TicketSessions)
            .WithOne(ts => ts.Ticket)
            .HasForeignKey(ts => ts.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.VisitHistories)
            .WithOne(vh => vh.Ticket)
            .HasForeignKey(vh => vh.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index on TicketTypeId and Status
        builder.HasIndex(t => t.TicketTypeId).HasDatabaseName("IX_Tickets_TicketTypeId");
        builder.HasIndex(t => t.Status).HasDatabaseName("IX_Tickets_Status");
    }
}
