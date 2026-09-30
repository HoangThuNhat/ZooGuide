using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("CHAT_MESSAGES");

        builder.HasKey(cm => cm.MessageId);
        builder.Property(cm => cm.MessageId).UseIdentityColumn();

        builder.Property(cm => cm.ChatSessionId)
            .IsRequired();

        builder.Property(cm => cm.SenderType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(cm => cm.Content)
            .IsRequired()
            .HasColumnType("nvarchar(max)");

        builder.Property(cm => cm.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(cm => cm.ChatSession)
            .WithMany(cs => cs.Messages)
            .HasForeignKey(cm => cm.ChatSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(cm => cm.ChatSessionId).HasDatabaseName("IX_ChatMessages_ChatSessionId");
    }
}
