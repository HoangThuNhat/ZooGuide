using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class ContentTranslationConfiguration : IEntityTypeConfiguration<ContentTranslation>
{
    public void Configure(EntityTypeBuilder<ContentTranslation> builder)
    {
        builder.ToTable("CONTENT_TRANSLATIONS");

        builder.HasKey(ct => ct.TranslationId);
        builder.Property(ct => ct.TranslationId).UseIdentityColumn();

        builder.Property(ct => ct.EntityType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(ct => ct.EntityId)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(ct => ct.EntityKey)
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue(string.Empty);

        builder.Property(ct => ct.LanguageCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(ct => ct.Title)
            .HasMaxLength(300)
            .IsRequired(false);

        builder.Property(ct => ct.Summary)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(ct => ct.Description)
            .IsRequired(false);

        builder.Property(ct => ct.ExtraJson)
            .IsRequired(false);

        builder.Property(ct => ct.TranslationStatus)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("Published");

        builder.Property(ct => ct.IsPublished)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(ct => ct.SourceReference)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(ct => ct.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(ct => ct.UpdatedAt)
            .IsRequired(false);

        builder.HasIndex(ct => new { ct.EntityType, ct.EntityId, ct.EntityKey, ct.LanguageCode })
            .IsUnique()
            .HasDatabaseName("UQ_ContentTranslations_Entity_Lang");

        builder.HasIndex(ct => new { ct.LanguageCode, ct.EntityType })
            .HasDatabaseName("IX_ContentTranslations_Lang_Type");
    }
}
