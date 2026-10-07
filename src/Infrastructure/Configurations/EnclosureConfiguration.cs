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
        builder.Property(e => e.EnclosureId)
            .HasColumnName("EnclosureId")
            .UseIdentityColumn();

        builder.Property(e => e.AreaId)
            .HasColumnName("AreaId")
            .IsRequired();

        builder.Property(e => e.Name)
            .HasColumnName("Name")
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasColumnName("Description")
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(e => e.ImageUrl)
            .HasColumnName("ImageUrl")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(e => e.Status)
            .HasColumnName("Status")
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Active");

        builder.Property(e => e.CreatedAt)
            .HasColumnName("CreatedAt")
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(e => e.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .IsRequired(false);

        builder.HasOne(e => e.Area)
            .WithMany()
            .HasForeignKey(e => e.AreaId)
            .HasConstraintName("FK_ENCLOSURES_AREAS")
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.AreaId)
            .HasDatabaseName("IX_Enclosures_AreaId");
    }
}
