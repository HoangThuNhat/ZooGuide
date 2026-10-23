using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class TicketOrderConfiguration : IEntityTypeConfiguration<TicketOrder>
{
    public void Configure(EntityTypeBuilder<TicketOrder> builder)
    {
        builder.ToTable("TICKET_ORDERS");

        builder.HasKey(o => o.OrderId);
        builder.Property(o => o.OrderId).UseIdentityColumn();

        builder.Property(o => o.OrderCode)
            .IsRequired()
            .HasMaxLength(50);
        builder.HasIndex(o => o.OrderCode)
            .IsUnique()
            .HasDatabaseName("UQ_TicketOrders_OrderCode");

        builder.Property(o => o.CustomerName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.CustomerEmail)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.CustomerPhone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(o => o.TicketTypeId)
            .IsRequired();

        builder.Property(o => o.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(o => o.UnitPrice)
            .IsRequired()
            .HasColumnType("numeric(18,2)");

        builder.Property(o => o.TotalAmount)
            .IsRequired()
            .HasColumnType("numeric(18,2)");

        builder.Property(o => o.PaymentStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(o => o.PaymentMethod)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("VietQR");

        builder.Property(o => o.PaymentDescription)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.TransactionReference)
            .IsRequired(false)
            .HasMaxLength(100);

        builder.Property(o => o.QrCodeUrl)
            .IsRequired(false)
            .HasMaxLength(500);

        builder.Property(o => o.PaidAt)
            .IsRequired(false);

        builder.Property(o => o.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(o => o.UpdatedAt)
            .IsRequired(false);

        builder.Property(o => o.ExpiresAt)
            .IsRequired();

        // Relationships
        builder.HasOne(o => o.TicketType)
            .WithMany()
            .HasForeignKey(o => o.TicketTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Tickets)
            .WithOne(t => t.Order)
            .HasForeignKey(t => t.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(o => o.PaymentStatus).HasDatabaseName("IX_TicketOrders_PaymentStatus");
    }
}
