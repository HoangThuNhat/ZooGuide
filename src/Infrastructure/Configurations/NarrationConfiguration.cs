using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class NarrationConfiguration : IEntityTypeConfiguration<Narration>
{
    public void Configure(EntityTypeBuilder<Narration> builder)
    {
        builder.ToTable("NARRATIONS");

        builder.HasKey(n => n.NarrationId);
        builder.Property(n => n.NarrationId).UseIdentityColumn();

        builder.Property(n => n.AnimalId)
            .IsRequired();

        builder.Property(n => n.LanguageId)
            .IsRequired();

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Content)
            .IsRequired()
            .HasColumnType("nvarchar(max)");

        builder.Property(n => n.AudioUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(n => n.DurationSeconds)
            .IsRequired(false);

        builder.Property(n => n.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(n => n.CreatedBy)
            .IsRequired();

        builder.Property(n => n.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(n => n.UpdatedAt)
            .IsRequired(false);

        // Composite Unique Constraint: Each animal has only one active narration per language
        builder.HasIndex(n => new { n.AnimalId, n.LanguageId })
            .IsUnique()
            .HasDatabaseName("UQ_Narrations_Animal_Language");

        // Relationships
        builder.HasOne(n => n.Animal)
            .WithMany(a => a.Narrations)
            .HasForeignKey(n => n.AnimalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Language)
            .WithMany(l => l.Narrations)
            .HasForeignKey(n => n.LanguageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Creator)
            .WithMany(u => u.NarrationsCreated)
            .HasForeignKey(n => n.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(n => n.Audios)
            .WithOne(au => au.Narration)
            .HasForeignKey(au => au.NarrationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Additional index for language queries
        builder.HasIndex(n => n.LanguageId).HasDatabaseName("IX_Narrations_LanguageId");
        builder.HasIndex(n => n.CreatedBy).HasDatabaseName("IX_Narrations_CreatedBy");
    }
}
