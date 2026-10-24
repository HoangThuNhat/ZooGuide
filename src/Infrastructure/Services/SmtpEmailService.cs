using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QRCoder;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private string SmtpHost => 
        Environment.GetEnvironmentVariable("EMAIL_SMTP_HOST") 
        ?? _configuration["Email:SmtpHost"] 
        ?? "smtp.gmail.com";

    private int SmtpPort
    {
        get
        {
            var raw = Environment.GetEnvironmentVariable("EMAIL_SMTP_PORT") ?? _configuration["Email:SmtpPort"];
            return int.TryParse(raw, out var port) ? port : 587;
        }
    }

    private string? SmtpUser => 
        Environment.GetEnvironmentVariable("EMAIL_SMTP_USERNAME") 
        ?? _configuration["Email:SmtpUsername"];

    private string? SmtpPassword => 
        Environment.GetEnvironmentVariable("EMAIL_SMTP_PASSWORD") 
        ?? _configuration["Email:SmtpPassword"];

    private string FromName => 
        Environment.GetEnvironmentVariable("EMAIL_FROM_NAME") 
        ?? _configuration["Email:FromName"] 
        ?? "ZooGuide - Thảo Cầm Viên Sài Gòn";

    private string FromAddress => 
        Environment.GetEnvironmentVariable("EMAIL_FROM_ADDRESS") 
        ?? _configuration["Email:FromAddress"] 
        ?? SmtpUser 
        ?? "noreply@zooguide.vn";

    private bool EnableSsl
    {
        get
        {
            var raw = Environment.GetEnvironmentVariable("EMAIL_ENABLE_SSL") ?? _configuration["Email:EnableSsl"];
            return bool.TryParse(raw, out var ssl) ? ssl : true;
        }
    }

    public bool IsConfigured => 
        !string.IsNullOrWhiteSpace(SmtpHost) && 
        !string.IsNullOrWhiteSpace(SmtpUser) && 
        !string.IsNullOrWhiteSpace(SmtpPassword);

    public async Task<EmailSendResult> SendTicketConfirmationEmailAsync(
        TicketOrder order, 
        IEnumerable<Ticket> tickets, 
        string? recipientEmail = null)
    {
        if (order == null) throw new ArgumentNullException(nameof(order));

        var targetEmail = (recipientEmail ?? order.CustomerEmail ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(targetEmail) || !IsValidEmail(targetEmail))
        {
            return new EmailSendResult
            {
                Success = false,
                ErrorCode = "INVALID_EMAIL",
                Message = $"Địa chỉ email '{targetEmail}' không đúng định dạng hợp lệ."
            };
        }

        if (!IsConfigured)
        {
            _logger.LogWarning("Dịch vụ gửi email chưa được cấu hình SMTP (thiếu EMAIL_SMTP_USERNAME hoặc EMAIL_SMTP_PASSWORD). Đơn hàng {OrderCode} không thể gửi email.", order.OrderCode);
            return new EmailSendResult
            {
                Success = false,
                ErrorCode = "SMTP_NOT_CONFIGURED",
                Message = "Dịch vụ gửi email chưa được thiết lập tài khoản SMTP. Vui lòng cấu hình biến môi trường EMAIL_SMTP_USERNAME và EMAIL_SMTP_PASSWORD (Google App Password)."
            };
        }

        var ticketsList = tickets?.ToList() ?? new List<Ticket>();
        if (!ticketsList.Any())
        {
            return new EmailSendResult
            {
                Success = false,
                ErrorCode = "NO_TICKETS",
                Message = "Không có mã vé nào để gửi kèm trong email xác nhận."
            };
        }

        try
        {
            using var client = new SmtpClient(SmtpHost, SmtpPort)
            {
                EnableSsl = EnableSsl,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(SmtpUser, SmtpPassword),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 15000
            };

            using var message = new MailMessage
            {
                From = new MailAddress(FromAddress, FromName, Encoding.UTF8),
                Subject = $"Xác nhận vé tham quan ZooGuide - Đơn hàng #{order.OrderCode}",
                BodyEncoding = Encoding.UTF8,
                SubjectEncoding = Encoding.UTF8,
                IsBodyHtml = true
            };

            message.To.Add(new MailAddress(targetEmail, order.CustomerName, Encoding.UTF8));

            // Sinh mã QR cho từng vé dưới dạng PNG và đính kèm LinkedResource (CID)
            var qrResources = new List<LinkedResource>();
            var qrImagesHtml = new StringBuilder();

            using var qrGenerator = new QRCodeGenerator();

            int ticketIndex = 1;
            foreach (var ticket in ticketsList)
            {
                using var qrCodeData = qrGenerator.CreateQrCode(ticket.TicketCode, QRCodeGenerator.ECCLevel.Q);
                using var qrCode = new PngByteQRCode(qrCodeData);
                var qrBytes = qrCode.GetGraphic(16);

                var contentId = $"qr_{ticket.TicketCode.Replace("-", "_")}";
                var qrStream = new MemoryStream(qrBytes);
                var resource = new LinkedResource(qrStream, "image/png")
                {
                    ContentId = contentId,
                    TransferEncoding = TransferEncoding.Base64
                };
                qrResources.Add(resource);

                var ticketTypeName = order.TicketType?.Name ?? "Vé Tham Quan Tiêu Chuẩn";
                var validFromStr = ticket.ValidFrom.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
                var validUntilStr = ticket.ValidUntil.ToLocalTime().ToString("dd/MM/yyyy HH:mm");

                qrImagesHtml.Append($@"
                <div style=""background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:18px; margin-bottom:16px; text-align:center;"">
                    <div style=""font-size:12px; color:#15803D; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;"">
                        VÉ #{ticketIndex} &bull; {WebUtility.HtmlEncode(ticketTypeName)}
                    </div>
                    <div style=""font-family:monospace; font-size:17px; font-weight:800; color:#0F172A; margin-bottom:12px; letter-spacing:1px;"">
                        {WebUtility.HtmlEncode(ticket.TicketCode)}
                    </div>
                    <div style=""background:#FFFFFF; display:inline-block; padding:10px; border-radius:12px; border:1px solid #CBD5E1; box-shadow:0 2px 6px rgba(0,0,0,0.04);"">
                        <img src=""cid:{contentId}"" alt=""Mã QR Vé {WebUtility.HtmlEncode(ticket.TicketCode)}"" width=""180"" height=""180"" style=""display:block; margin:0 auto;"" />
                    </div>
                    <div style=""margin-top:10px; font-size:12px; color:#64748B;"">
                        Thời hạn sử dụng: <strong>{validFromStr}</strong> đến <strong>{validUntilStr}</strong>
                    </div>
                </div>");

                ticketIndex++;
            }

            var htmlContent = BuildEmailHtml(order, qrImagesHtml.ToString(), ticketsList.Count);
            var htmlView = AlternateView.CreateAlternateViewFromString(htmlContent, Encoding.UTF8, MediaTypeNames.Text.Html);

            foreach (var r in qrResources)
            {
                htmlView.LinkedResources.Add(r);
            }
            message.AlternateViews.Add(htmlView);

            _logger.LogInformation("Đang gửi email xác nhận vé cho đơn hàng {OrderCode} tới {Recipient}...", order.OrderCode, targetEmail);
            await client.SendMailAsync(message);
            _logger.LogInformation("Gửi email thành công cho đơn hàng {OrderCode} tới {Recipient}.", order.OrderCode, targetEmail);

            return new EmailSendResult
            {
                Success = true,
                Message = $"Mã vé và mã QR đã được gửi thành công đến địa chỉ {targetEmail}."
            };
        }
        catch (SmtpFailedRecipientException ex)
        {
            _logger.LogError("Địa chỉ người nhận {Recipient} bị máy chủ SMTP từ chối: {Message}", targetEmail, ex.Message);
            return new EmailSendResult
            {
                Success = false,
                ErrorCode = "INVALID_RECIPIENT",
                Message = $"Máy chủ từ chối địa chỉ email '{targetEmail}'. Vui lòng kiểm tra lại tính chính xác của địa chỉ."
            };
        }
        catch (SmtpException ex) when (ex.Message.Contains("Authentication", StringComparison.OrdinalIgnoreCase) || ex.StatusCode == SmtpStatusCode.MustIssueStartTlsFirst)
        {
            _logger.LogError("Xác thực SMTP thất bại: {Message}", ex.Message);
            return new EmailSendResult
            {
                Success = false,
                ErrorCode = "SMTP_AUTH_FAILED",
                Message = "Xác thực tài khoản SMTP Gmail thất bại. Vui lòng kiểm tra Google App Password."
            };
        }
        catch (SmtpException ex)
        {
            _logger.LogError("Lỗi kết nối hoặc gửi qua máy chủ SMTP: {Message}", ex.Message);
            return new EmailSendResult
            {
                Success = false,
                ErrorCode = "SMTP_CONNECTION_FAILED",
                Message = $"Không thể gửi email qua máy chủ SMTP ({SmtpHost}): {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Lỗi không mong đợi khi gửi email vé: {Message}", ex.Message);
            return new EmailSendResult
            {
                Success = false,
                ErrorCode = "EMAIL_SEND_ERROR",
                Message = $"Lỗi gửi email: {ex.Message}"
            };
        }
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        try
        {
            var match = Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(250));
            return match;
        }
        catch
        {
            return false;
        }
    }

    private static string BuildEmailHtml(TicketOrder order, string qrSectionHtml, int ticketCount)
    {
        var ticketTypeName = WebUtility.HtmlEncode(order.TicketType?.Name ?? "Vé tham quan tiêu chuẩn");
        var customerName = WebUtility.HtmlEncode(order.CustomerName);
        var orderCode = WebUtility.HtmlEncode(order.OrderCode);
        var totalAmountStr = $"{order.TotalAmount:N0} đ";
        var createdDateStr = order.CreatedAt.ToLocalTime().ToString("dd/MM/yyyy HH:mm");

        return $@"<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Xác nhận vé tham quan ZooGuide</title>
</head>
<body style=""margin:0; padding:0; background-color:#F1F5F9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0F172A;"">
    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color:#F1F5F9; padding:24px 12px;"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:580px; background-color:#FFFFFF; border-radius:18px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);"">
                    <!-- HEADER -->
                    <tr>
                        <td style=""background-color:#15803D; padding:28px 24px; text-align:center; color:#FFFFFF;"">
                            <div style=""font-size:12px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; opacity:0.9;"">THẢO CẦM VIÊN SÀI GÒN</div>
                            <h1 style=""margin:6px 0 0 0; font-size:22px; font-weight:800; letter-spacing:-0.5px;"">Xác Nhận Vé Tham Quan ZooGuide</h1>
                        </td>
                    </tr>

                    <!-- GREETING & INTRO -->
                    <tr>
                        <td style=""padding:24px 24px 12px 24px;"">
                            <p style=""margin:0 0 10px 0; font-size:15px; line-height:1.6;"">
                                Kính gửi Quý khách <strong>{customerName}</strong>,
                            </p>
                            <p style=""margin:0; font-size:14px; line-height:1.6; color:#475569;"">
                                Cảm ơn Quý khách đã mua vé tham quan qua nền tảng ZooGuide. Đơn hàng của Quý khách đã được xác nhận thanh toán thành công. Dưới đây là thông tin chi tiết đơn hàng và mã QR vé tham quan điện tử:
                            </p>
                        </td>
                    </tr>

                    <!-- ORDER SUMMARY BOX -->
                    <tr>
                        <td style=""padding:12px 24px;"">
                            <div style=""background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;"">
                                <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""font-size:13px; line-height:1.8;"">
                                    <tr>
                                        <td style=""color:#64748B; width:40%;"">Mã đơn hàng:</td>
                                        <td style=""font-weight:700; color:#0F172A; text-align:right;"">#{orderCode}</td>
                                    </tr>
                                    <tr>
                                        <td style=""color:#64748B;"">Hạng vé:</td>
                                        <td style=""font-weight:600; color:#0F172A; text-align:right;"">{ticketTypeName}</td>
                                    </tr>
                                    <tr>
                                        <td style=""color:#64748B;"">Số lượng vé:</td>
                                        <td style=""font-weight:700; color:#15803D; text-align:right;"">{ticketCount} vé</td>
                                    </tr>
                                    <tr>
                                        <td style=""color:#64748B;"">Tổng thanh toán:</td>
                                        <td style=""font-weight:800; color:#15803D; font-size:14px; text-align:right;"">{totalAmountStr}</td>
                                    </tr>
                                    <tr>
                                        <td style=""color:#64748B;"">Thời gian đặt:</td>
                                        <td style=""color:#475569; text-align:right;"">{createdDateStr}</td>
                                    </tr>
                                    <tr>
                                        <td style=""color:#64748B;"">Trạng thái:</td>
                                        <td style=""font-weight:700; color:#166534; text-align:right;"">Đã thanh toán (Paid)</td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- TICKETS QR SECTION -->
                    <tr>
                        <td style=""padding:12px 24px;"">
                            <div style=""font-weight:700; font-size:14px; color:#0F172A; margin-bottom:12px;"">
                                DANH SÁCH MÃ QR VÉ THAM QUAN:
                            </div>
                            {qrSectionHtml}
                        </td>
                    </tr>

                    <!-- INSTRUCTIONS -->
                    <tr>
                        <td style=""padding:12px 24px 20px 24px;"">
                            <div style=""background-color:#EFF6FF; border-left:4px solid #3B82F6; border-radius:8px; padding:14px 16px;"">
                                <div style=""font-weight:700; font-size:13px; color:#1E40AF; margin-bottom:6px;"">
                                    HƯỚNG DẪN SỬ DỤNG MÃ QR TẠI ĐIỂM KIỂM SOÁT:
                                </div>
                                <ul style=""margin:0; padding-left:18px; font-size:12.5px; color:#1E3A8A; line-height:1.6;"">
                                    <li>Xuất trình mã QR trên trực tiếp tại quầy soát vé hoặc cổng kiểm soát tự động tại Thảo Cầm Viên Sài Gòn.</li>
                                    <li>Mỗi mã QR tương ứng với 01 lượt tham quan hợp lệ và sẽ được kích hoạt vào ngày tham quan.</li>
                                    <li>Quý khách có thể sử dụng camera trên ứng dụng web ZooGuide để quét mã vé này để mở khóa thuyết minh âm thanh đa ngôn ngữ và bản đồ định vị GPS.</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- FOOTER & SUPPORT -->
                    <tr>
                        <td style=""background-color:#F8FAFC; border-top:1px solid #E2E8F0; padding:20px 24px; text-align:center; font-size:12px; color:#64748B; line-height:1.6;"">
                            <div style=""font-weight:700; color:#0F172A; margin-bottom:4px;"">BAN QUẢN LÝ THẢO CẦM VIÊN SÀI GÒN - ZOOGUIDE</div>
                            <div>Địa chỉ: Số 2 Nguyễn Bỉnh Khiêm, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</div>
                            <div>Hotline hỗ trợ: <strong>028 3829 1425</strong> &bull; Email: <strong>support@zooguide.vn</strong></div>
                            <div style=""margin-top:8px; font-size:11px; color:#94A3B8;"">
                                Email này được gửi tự động từ hệ thống ZooGuide. Vui lòng không trả lời trực tiếp email này.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }
}
