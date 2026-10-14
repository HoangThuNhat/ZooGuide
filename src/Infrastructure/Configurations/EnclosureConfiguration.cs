using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class EnclosureConfiguration : IEntityTypeConfiguration<Enclosure>
{
    public void Configure(EntityTypeBuilder<Enclosure> builder)
    {
        builder.ToTable("ENCLOSURES");

        builder.HasKey(e => e.EnclosureId);
        builder.Property(e => e.EnclosureId).UseIdentityColumn();

        builder.Property(e => e.AreaId)
            .IsRequired();

        builder.Property(e => e.Code)
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Description)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(e => e.ImageUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(e => e.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(e => e.MapX)
            .HasPrecision(8, 2)
            .IsRequired(false);

        builder.Property(e => e.MapY)
            .HasPrecision(8, 2)
            .IsRequired(false);

        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(e => e.UpdatedAt)
            .IsRequired(false);

        // Relationships
        builder.HasOne(e => e.Area)
            .WithMany(a => a.Enclosures)
            .HasForeignKey(e => e.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Animals)
            .WithOne(a => a.Enclosure)
            .HasForeignKey(a => a.EnclosureId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.AreaId).HasDatabaseName("IX_Enclosures_AreaId");
        builder.HasIndex(e => e.Status).HasDatabaseName("IX_Enclosures_Status");
    }
}
