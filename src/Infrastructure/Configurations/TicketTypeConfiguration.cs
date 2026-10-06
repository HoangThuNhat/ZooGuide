using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class TicketTypeConfiguration : IEntityTypeConfiguration<TicketType>
{
    public void Configure(EntityTypeBuilder<TicketType> builder)
    {
        builder.ToTable("TICKET_TYPES");

        builder.HasKey(tt => tt.TicketTypeId);
        builder.Property(tt => tt.TicketTypeId).UseIdentityColumn();

        builder.Property(tt => tt.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(tt => tt.Description)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(tt => tt.Price)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(tt => tt.DurationMinutes)
            .IsRequired();

        builder.Property(tt => tt.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(tt => tt.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(tt => tt.UpdatedAt)
            .IsRequired(false);

        builder.HasMany(tt => tt.Tickets)
            .WithOne(t => t.TicketType)
            .HasForeignKey(t => t.TicketTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
