using System.ComponentModel.DataAnnotations;

namespace smart_marketplace_new.dto;

public class VerifyOtpRequest
{
    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã OTP không được để trống.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải có đúng 6 chữ số.")]
    public string Otp { get; set; } = string.Empty;
}
