using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class PointOfInterestConfiguration : IEntityTypeConfiguration<PointOfInterest>
{
    public void Configure(EntityTypeBuilder<PointOfInterest> builder)
    {
        builder.ToTable("POINTS_OF_INTEREST", table =>
    table.HasCheckConstraint(
        "CK_POINTS_OF_INTEREST_RadiusMeters_NonNegative",
        "\"RadiusMeters\" >= 0"));

        builder.HasKey(p => p.PoiId);
        builder.Property(p => p.PoiId).UseIdentityColumn();

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(50);
        builder.HasIndex(p => p.Code)
            .IsUnique()
            .HasDatabaseName("UQ_PointsOfInterest_Code");

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(p => p.Description)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(p => p.Category)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Landmark");

        builder.Property(p => p.Latitude)
            .IsRequired()
            .HasPrecision(10, 7);

        builder.Property(p => p.Longitude)
            .IsRequired()
            .HasPrecision(10, 7);

            builder.Property(p => p.RadiusMeters)
                .IsRequired()
                .HasPrecision(8, 2)
                .HasDefaultValue(50m);

        builder.Property(p => p.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(p => p.IsCoordinateVerified)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.VerificationSource)
            .HasMaxLength(250)
            .IsRequired(false);

        builder.Property(p => p.ImageUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(p => p.AreaId)
            .IsRequired(false);

        builder.Property(p => p.CreatedBy)
            .IsRequired(false);

        builder.Property(p => p.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(p => p.UpdatedAt)
            .IsRequired(false);

        // Relationships
        builder.HasOne(p => p.Area)
            .WithMany()
            .HasForeignKey(p => p.AreaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.Creator)
            .WithMany()
            .HasForeignKey(p => p.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.Narrations)
            .WithOne(n => n.PointOfInterest)
            .HasForeignKey(n => n.PoiId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.Category).HasDatabaseName("IX_PointsOfInterest_Category");
        builder.HasIndex(p => p.IsActive).HasDatabaseName("IX_PointsOfInterest_IsActive");
        builder.HasIndex(p => p.IsCoordinateVerified).HasDatabaseName("IX_PointsOfInterest_IsCoordinateVerified");
    }
}
