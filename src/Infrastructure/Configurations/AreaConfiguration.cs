using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class AreaConfiguration : IEntityTypeConfiguration<Area>
{
    public void Configure(EntityTypeBuilder<Area> builder)
    {
        builder.ToTable("AREAS");

        builder.HasKey(a => a.AreaId);
        builder.Property(a => a.AreaId).UseIdentityColumn();

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(100);
        builder.HasIndex(a => a.Name)
            .IsUnique()
            .HasDatabaseName("UQ_Areas_Name");

        builder.Property(a => a.Description)
            .HasMaxLength(1000)
            .IsRequired(false);

        // Latitude & Longitude using exact decimal(9,6) suitable for GPS
        builder.Property(a => a.Latitude)
            .IsRequired()
            .HasPrecision(9, 6);

        builder.Property(a => a.Longitude)
            .IsRequired()
            .HasPrecision(9, 6);

        // Radius in meters to detect if visitor is within proximity
        builder.Property(a => a.RadiusMeters)
            .IsRequired()
            .HasPrecision(8, 2);

        builder.Property(a => a.MapImageUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(a => a.Code)
            .HasMaxLength(20)
            .IsRequired(false);

        builder.Property(a => a.MapX)
            .HasPrecision(8, 2)
            .IsRequired(false);

        builder.Property(a => a.MapY)
            .HasPrecision(8, 2)
            .IsRequired(false);

        builder.Property(a => a.ReferenceSource)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(a => a.UpdatedAt)
            .IsRequired(false);

        builder.HasMany(a => a.Enclosures)
            .WithOne(e => e.Area)
            .HasForeignKey(e => e.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.Animals)
            .WithOne(an => an.Area)
            .HasForeignKey(an => an.AreaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
