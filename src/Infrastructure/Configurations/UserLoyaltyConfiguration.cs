using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class UserLoyaltyConfiguration : IEntityTypeConfiguration<UserLoyalty>
{
    public void Configure(EntityTypeBuilder<UserLoyalty> builder)
    {
        builder.ToTable("USER_LOYALTY");

        // Primary key is also Foreign Key to USERS (1-to-1 relationship)
        builder.HasKey(ul => ul.UserId);

        builder.Property(ul => ul.Points)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(ul => ul.MembershipLevelId)
            .IsRequired();

        builder.Property(ul => ul.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships
        builder.HasOne(ul => ul.User)
            .WithOne(u => u.Loyalty)
            .HasForeignKey<UserLoyalty>(ul => ul.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ul => ul.MembershipLevel)
            .WithMany(ml => ml.UserLoyalties)
            .HasForeignKey(ul => ul.MembershipLevelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ul => ul.MembershipLevelId).HasDatabaseName("IX_UserLoyalty_MembershipLevelId");
    }
}
