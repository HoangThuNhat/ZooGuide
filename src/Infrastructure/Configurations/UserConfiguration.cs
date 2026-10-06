using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("USERS");

        builder.HasKey(u => u.UserId);
        builder.Property(u => u.UserId).UseIdentityColumn();

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(50);
        builder.HasIndex(u => u.Username)
            .IsUnique()
            .HasDatabaseName("UQ_Users_Username");

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(100);
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("UQ_Users_Email");

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(u => u.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(u => u.UpdatedAt)
            .IsRequired(false);

        builder.Property(u => u.LastLoginAt)
            .IsRequired(false);

        // Relationships
        builder.HasMany(u => u.TicketSessions)
            .WithOne(ts => ts.User)
            .HasForeignKey(ts => ts.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(u => u.VisitHistories)
            .WithOne(vh => vh.User)
            .HasForeignKey(vh => vh.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(u => u.NarrationsCreated)
            .WithOne(n => n.Creator)
            .HasForeignKey(n => n.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Loyalty)
            .WithOne(l => l.User)
            .HasForeignKey<UserLoyalty>(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
