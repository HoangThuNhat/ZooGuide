using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class VisitHistoryConfiguration : IEntityTypeConfiguration<VisitHistory>
{
    public void Configure(EntityTypeBuilder<VisitHistory> builder)
    {
        builder.ToTable("VISIT_HISTORY");

        builder.HasKey(vh => vh.VisitId);
        builder.Property(vh => vh.VisitId).UseIdentityColumn();

        builder.Property(vh => vh.UserId)
            .IsRequired();

        builder.Property(vh => vh.TicketId)
            .IsRequired();

        builder.Property(vh => vh.SessionId)
            .IsRequired();

        builder.Property(vh => vh.VisitedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        // Relationships: Restrict delete to preserve audit log
        builder.HasOne(vh => vh.User)
            .WithMany(u => u.VisitHistories)
            .HasForeignKey(vh => vh.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(vh => vh.Ticket)
            .WithMany(t => t.VisitHistories)
            .HasForeignKey(vh => vh.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(vh => vh.Session)
            .WithMany(s => s.VisitHistories)
            .HasForeignKey(vh => vh.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(vh => vh.UserId).HasDatabaseName("IX_VisitHistory_UserId");
        builder.HasIndex(vh => vh.TicketId).HasDatabaseName("IX_VisitHistory_TicketId");
        builder.HasIndex(vh => vh.SessionId).HasDatabaseName("IX_VisitHistory_SessionId");
    }
}
