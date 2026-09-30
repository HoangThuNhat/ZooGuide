using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class MembershipLevelConfiguration : IEntityTypeConfiguration<MembershipLevel>
{
    public void Configure(EntityTypeBuilder<MembershipLevel> builder)
    {
        builder.ToTable("MEMBERSHIP_LEVELS");

        builder.HasKey(ml => ml.MembershipLevelId);
        builder.Property(ml => ml.MembershipLevelId).UseIdentityColumn();

        builder.Property(ml => ml.Name)
            .IsRequired()
            .HasMaxLength(50);
        builder.HasIndex(ml => ml.Name)
            .IsUnique()
            .HasDatabaseName("UQ_MembershipLevels_Name");

        builder.Property(ml => ml.MinPoints)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(ml => ml.Description)
            .HasMaxLength(255)
            .IsRequired(false);

        builder.Property(ml => ml.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(ml => ml.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(ml => ml.UpdatedAt)
            .IsRequired(false);

        builder.HasMany(ml => ml.UserLoyalties)
            .WithOne(ul => ul.MembershipLevel)
            .HasForeignKey(ul => ul.MembershipLevelId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
