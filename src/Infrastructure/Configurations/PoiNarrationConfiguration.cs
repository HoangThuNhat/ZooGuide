using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class PoiNarrationConfiguration : IEntityTypeConfiguration<PoiNarration>
{
    public void Configure(EntityTypeBuilder<PoiNarration> builder)
    {
        builder.ToTable("POI_NARRATIONS");

        builder.HasKey(n => n.PoiNarrationId);
        builder.Property(n => n.PoiNarrationId).UseIdentityColumn();

        builder.Property(n => n.PoiId)
            .IsRequired();

        builder.Property(n => n.LanguageId)
            .IsRequired();

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Content)
            .IsRequired();

        builder.Property(n => n.AudioUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(n => n.DurationSeconds)
            .IsRequired(false);

        builder.Property(n => n.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(n => n.ReferenceSource)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(n => n.CreatedBy)
            .IsRequired();

        builder.Property(n => n.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(n => n.UpdatedAt)
            .IsRequired(false);

        // Composite Unique Constraint: One narration per language per POI
        builder.HasIndex(n => new { n.PoiId, n.LanguageId })
            .IsUnique()
            .HasDatabaseName("UQ_PoiNarrations_Poi_Language");

        // Relationships
        builder.HasOne(n => n.PointOfInterest)
            .WithMany(p => p.Narrations)
            .HasForeignKey(n => n.PoiId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Language)
            .WithMany()
            .HasForeignKey(n => n.LanguageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Creator)
            .WithMany()
            .HasForeignKey(n => n.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(n => n.LanguageId).HasDatabaseName("IX_PoiNarrations_LanguageId");
        builder.HasIndex(n => n.CreatedBy).HasDatabaseName("IX_PoiNarrations_CreatedBy");
    }
}
