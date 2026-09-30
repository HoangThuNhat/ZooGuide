using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class AudioConfiguration : IEntityTypeConfiguration<Audio>
{
    public void Configure(EntityTypeBuilder<Audio> builder)
    {
        builder.ToTable("AUDIOS");

        builder.HasKey(au => au.AudioId);
        builder.Property(au => au.AudioId).UseIdentityColumn();

        builder.Property(au => au.NarrationId)
            .IsRequired();

        builder.Property(au => au.FileUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(au => au.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(au => au.MimeType)
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("audio/mpeg");

        builder.Property(au => au.DurationSeconds)
            .IsRequired(false);

        builder.Property(au => au.FileSize)
            .IsRequired(false);

        builder.Property(au => au.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(au => au.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(au => au.UpdatedAt)
            .IsRequired(false);

        // Relationships: 1 Narration -> N Audios
        builder.HasOne(au => au.Narration)
            .WithMany(n => n.Audios)
            .HasForeignKey(au => au.NarrationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(au => au.NarrationId).HasDatabaseName("IX_Audios_NarrationId");
    }
}
