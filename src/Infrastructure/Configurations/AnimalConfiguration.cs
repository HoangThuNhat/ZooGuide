using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class AnimalConfiguration : IEntityTypeConfiguration<Animal>
{
    public void Configure(EntityTypeBuilder<Animal> builder)
    {
        builder.ToTable("ANIMALS");

        builder.HasKey(a => a.AnimalId);
        builder.Property(a => a.AnimalId).UseIdentityColumn();

        builder.Property(a => a.SpeciesId)
            .IsRequired();

        builder.Property(a => a.AreaId)
            .IsRequired();

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Description)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(a => a.Gender)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(10);

        builder.Property(a => a.DateOfBirth)
            .HasColumnType("date")
            .IsRequired(false);

        builder.Property(a => a.Origin)
            .HasMaxLength(200)
            .IsRequired(false);

        builder.Property(a => a.HealthStatus)
            .HasMaxLength(200)
            .IsRequired(false);

        builder.Property(a => a.ConservationNote)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(a => a.ImageUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(a => a.UpdatedAt)
            .IsRequired(false);

        // Relationships
        builder.HasOne(a => a.Species)
            .WithMany(s => s.Animals)
            .HasForeignKey(a => a.SpeciesId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Area)
            .WithMany(ar => ar.Animals)
            .HasForeignKey(a => a.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.Narrations)
            .WithOne(n => n.Animal)
            .HasForeignKey(n => n.AnimalId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes on Foreign Keys for quick lookups
        builder.HasIndex(a => a.SpeciesId).HasDatabaseName("IX_Animals_SpeciesId");
        builder.HasIndex(a => a.AreaId).HasDatabaseName("IX_Animals_AreaId");
        builder.HasIndex(a => a.Status).HasDatabaseName("IX_Animals_Status");
    }
}
