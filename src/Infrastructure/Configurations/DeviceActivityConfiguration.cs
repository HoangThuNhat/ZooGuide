using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class DeviceActivityConfiguration : IEntityTypeConfiguration<DeviceActivity>
{
    public void Configure(EntityTypeBuilder<DeviceActivity> builder)
    {
        builder.ToTable("DEVICE_ACTIVITIES");

        builder.HasKey(d => d.DeviceActivityId);
        builder.Property(d => d.DeviceActivityId).UseIdentityColumn();

        builder.Property(d => d.InstallationId)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(d => d.InstallationId)
            .IsUnique()
            .HasDatabaseName("UQ_DeviceActivities_InstallationId");

        builder.Property(d => d.FirstSeenAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(d => d.LastSeenAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasIndex(d => d.LastSeenAt)
            .HasDatabaseName("IX_DeviceActivities_LastSeenAt");

        builder.Property(d => d.UserAgent)
            .HasMaxLength(255)
            .IsRequired(false);

        builder.Property(d => d.IpAddressHash)
            .HasMaxLength(64)
            .IsRequired(false);

        builder.Property(d => d.HeartbeatCount)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(d => d.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(d => d.UpdatedAt)
            .IsRequired(false);
    }
}
