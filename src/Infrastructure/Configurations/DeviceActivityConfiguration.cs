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
        builder.Property(d => d.DeviceActivityId).UseIdentityByDefaultColumn();

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

        builder.Property(d => d.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(d => d.DisconnectedAt)
            .IsRequired(false);

        builder.HasIndex(d => new { d.IsActive, d.LastSeenAt })
            .HasDatabaseName("IX_DeviceActivities_IsActive_LastSeenAt");
    }
}

public class NarrationTelemetryEventConfiguration : IEntityTypeConfiguration<NarrationTelemetryEvent>
{
    public void Configure(EntityTypeBuilder<NarrationTelemetryEvent> builder)
    {
        builder.ToTable("NARRATION_TELEMETRY_EVENTS");

        builder.HasKey(e => e.TelemetryEventId);
        builder.Property(e => e.TelemetryEventId).UseIdentityByDefaultColumn();

        builder.Property(e => e.Category).IsRequired().HasMaxLength(40);
        builder.Property(e => e.EventType).IsRequired().HasMaxLength(60);
        builder.Property(e => e.InstallationId).HasMaxLength(128).IsRequired(false);
        builder.Property(e => e.SessionId).IsRequired(false);
        builder.Property(e => e.LanguageCode).HasMaxLength(16).IsRequired(false);
        builder.Property(e => e.TargetType).HasMaxLength(40).IsRequired(false);
        builder.Property(e => e.TargetId).IsRequired(false);
        builder.Property(e => e.TargetCode).HasMaxLength(100).IsRequired(false);
        builder.Property(e => e.TargetName).HasMaxLength(255).IsRequired(false);
        builder.Property(e => e.TriggerSource).HasMaxLength(40).IsRequired(false);
        builder.Property(e => e.ListenDurationSeconds).IsRequired(false);
        builder.Property(e => e.TotalDurationSeconds).IsRequired(false);
        builder.Property(e => e.DistanceMeters).HasColumnType("numeric(10,2)").IsRequired(false);
        builder.Property(e => e.AccuracyMeters).HasColumnType("numeric(10,2)").IsRequired(false);
        builder.Property(e => e.IsSuccess).IsRequired().HasDefaultValue(true);
        builder.Property(e => e.ErrorCode).HasMaxLength(80).IsRequired(false);
        builder.Property(e => e.ErrorMessage).IsRequired(false);
        builder.Property(e => e.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_NARRATION_TELEMETRY_EVENTS_CreatedAt");
        builder.HasIndex(e => new { e.Category, e.EventType }).HasDatabaseName("IX_NARRATION_TELEMETRY_EVENTS_Category_EventType");
        builder.HasIndex(e => new { e.TargetType, e.TargetId }).HasDatabaseName("IX_NARRATION_TELEMETRY_EVENTS_Target");
        builder.HasIndex(e => e.LanguageCode).HasDatabaseName("IX_NARRATION_TELEMETRY_EVENTS_LanguageCode");
    }
}
