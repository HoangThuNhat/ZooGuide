using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class SpeciesConfiguration : IEntityTypeConfiguration<Species>
{
    public void Configure(EntityTypeBuilder<Species> builder)
    {
        builder.ToTable("SPECIES");

        builder.HasKey(s => s.SpeciesId);
        builder.Property(s => s.SpeciesId).UseIdentityColumn();

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);
        builder.HasIndex(s => s.Name)
            .IsUnique()
            .HasDatabaseName("UQ_Species_Name");

        builder.Property(s => s.ScientificName)
            .HasMaxLength(150)
            .IsRequired(false);

        builder.Property(s => s.Description)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(s => s.ConservationStatus)
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(s => s.ImageUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(s => s.UpdatedAt)
            .IsRequired(false);

        builder.HasMany(s => s.Animals)
            .WithOne(a => a.Species)
            .HasForeignKey(a => a.SpeciesId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
