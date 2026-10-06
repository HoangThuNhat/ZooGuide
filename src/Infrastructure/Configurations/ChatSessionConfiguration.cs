using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Configurations;

public class ChatSessionConfiguration : IEntityTypeConfiguration<ChatSession>
{
    public void Configure(EntityTypeBuilder<ChatSession> builder)
    {
        builder.ToTable("CHAT_SESSIONS");

        builder.HasKey(cs => cs.ChatSessionId);
        builder.Property(cs => cs.ChatSessionId)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(cs => cs.SessionId)
            .IsRequired();

        builder.Property(cs => cs.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(cs => cs.EndedAt)
            .IsRequired(false);

        builder.HasOne(cs => cs.TicketSession)
            .WithMany(ts => ts.ChatSessions)
            .HasForeignKey(cs => cs.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(cs => cs.SessionId).HasDatabaseName("IX_ChatSessions_SessionId");
    }
}
