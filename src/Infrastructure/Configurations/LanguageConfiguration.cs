using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class LanguageConfiguration : IEntityTypeConfiguration<Language>
{
    public void Configure(EntityTypeBuilder<Language> builder)
    {
        builder.ToTable("LANGUAGES");

        builder.HasKey(l => l.LanguageId);
        builder.Property(l => l.LanguageId).UseIdentityColumn();

        builder.Property(l => l.Code)
            .IsRequired()
            .HasMaxLength(10);
        builder.HasIndex(l => l.Code)
            .IsUnique()
            .HasDatabaseName("UQ_Languages_Code");

        builder.Property(l => l.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(l => l.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(l => l.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(l => l.UpdatedAt)
            .IsRequired(false);

        builder.HasMany(l => l.Narrations)
            .WithOne(n => n.Language)
            .HasForeignKey(n => n.LanguageId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
