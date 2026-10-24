using System.Collections.Generic;
using System.Threading.Tasks;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

public class EmailSendResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
}

public interface IEmailService
{
    bool IsConfigured { get; }
    Task<EmailSendResult> SendTicketConfirmationEmailAsync(
        TicketOrder order, 
        IEnumerable<Ticket> tickets, 
        string? recipientEmail = null);
}
