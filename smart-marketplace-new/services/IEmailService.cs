namespace smart_marketplace_new.services;

public interface IEmailService
{
    Task SendPasswordResetOtpAsync(string toEmail, string recipientName, string otpCode, CancellationToken ct = default);
}
