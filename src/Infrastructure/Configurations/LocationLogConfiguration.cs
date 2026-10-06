using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class LocationLogConfiguration : IEntityTypeConfiguration<LocationLog>
{
    public void Configure(EntityTypeBuilder<LocationLog> builder)
    {
        builder.ToTable("LOCATION_LOGS");

        builder.HasKey(ll => ll.LocationLogId);
        builder.Property(ll => ll.LocationLogId).UseIdentityColumn();

        builder.Property(ll => ll.SessionId)
            .IsRequired();

        builder.Property(ll => ll.Latitude)
            .IsRequired()
            .HasPrecision(9, 6);

        builder.Property(ll => ll.Longitude)
            .IsRequired()
            .HasPrecision(9, 6);

        builder.Property(ll => ll.Accuracy)
            .HasPrecision(6, 2)
            .IsRequired(false);

        builder.Property(ll => ll.RecordedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(ll => ll.Session)
            .WithMany(s => s.LocationLogs)
            .HasForeignKey(ll => ll.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Composite index for querying route trajectory by session ordered by time
        builder.HasIndex(ll => new { ll.SessionId, ll.RecordedAt })
            .HasDatabaseName("IX_LocationLogs_SessionId_RecordedAt");
    }
}
