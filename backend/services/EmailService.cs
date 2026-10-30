using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace smart_marketplace_new.services;

public class EmailService : IEmailService
{
    private readonly string _smtpServer;
    private readonly int _port;
    private readonly string _senderEmail;
    private readonly string _senderName;
    private readonly string _password;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _logger = logger;
        _smtpServer = config["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
        _port = int.TryParse(config["EmailSettings:Port"], out var p) ? p : 587;
        _senderEmail = config["EmailSettings:SenderEmail"] ?? "";
        _senderName = config["EmailSettings:SenderName"] ?? "TaskMate Support";
        _password = config["EmailSettings:Password"] ?? "";
    }

    public async Task SendPasswordResetOtpAsync(string toEmail, string recipientName, string otpCode, CancellationToken ct = default)
    {
        _logger.LogInformation(">>> [TASKMATE OTP] Gửi OTP cho {Email} ({Name}): {Otp}", toEmail, recipientName, otpCode);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_senderName, _senderEmail));
        message.To.Add(new MailboxAddress(recipientName, toEmail));
        message.Subject = $"[TaskMate] Mã OTP xác thực đặt lại mật khẩu: {otpCode}";
        message.Priority = MessagePriority.Urgent;

        var bodyBuilder = new BodyBuilder
        {
            TextBody = $"Xin chào {recipientName},\n\nMã OTP xác minh đặt lại mật khẩu của bạn là: {otpCode}\n\nMã có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\n\nTaskMate Support",
            HtmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }}
    .container {{ max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .logo {{ font-size: 28px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.5px; }}
    .logo span {{ color: #2563eb; }}
    .title {{ font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 14px; margin-bottom: 8px; }}
    .desc {{ font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }}
    .otp-box {{ text-align: center; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 14px; padding: 22px; margin-bottom: 24px; }}
    .otp-code {{ font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; font-family: monospace; }}
    .otp-expiry {{ font-size: 13px; color: #64748b; margin-top: 10px; font-weight: 600; }}
    .note {{ font-size: 13px; color: #475569; background-color: #fffbeb; padding: 14px 18px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 24px; line-height: 1.5; }}
    .footer {{ text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <div class='logo'>Task<span>Mate</span></div>
      <div class='title'>Yêu cầu đặt lại mật khẩu</div>
    </div>
    <div class='desc'>
      Xin chào <strong>{recipientName}</strong>,<br>
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>{toEmail}</strong> trên nền tảng <strong>TaskMate</strong>.
      <br><br>
      Vui lòng sử dụng mã xác minh OTP 6 số dưới đây để tiếp tục:
    </div>
    <div class='otp-box'>
      <div class='otp-code'>{otpCode}</div>
      <div class='otp-expiry'>⏱️ Mã có hiệu lực trong vòng 5 phút</div>
    </div>
    <div class='note'>
      🔒 <strong>Lưu ý bảo mật:</strong> Không cung cấp mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và mật khẩu của bạn vẫn được giữ an toàn.
    </div>
    <div class='footer'>
      Email tự động được gửi từ hệ thống TaskMate &bull; Nền tảng Đặt việc vặt & Kết nối thợ chuyên nghiệp<br>
      &copy; {DateTime.UtcNow.Year} TaskMate Platform. All rights reserved.
    </div>
  </div>
</body>
</html>"
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(_smtpServer, _port, SecureSocketOptions.StartTls, ct);
            await client.AuthenticateAsync(_senderEmail, _password, ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);
            _logger.LogInformation("Gửi email OTP thành công cho: {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Thất bại khi gửi email OTP qua SMTP Gmail ({SmtpServer}:{Port}) cho: {Email}", _smtpServer, _port, toEmail);
            throw new InvalidOperationException($"Lỗi hệ thống gửi email: {ex.Message}. Vui lòng thử lại sau.", ex);
        }
    }
}
