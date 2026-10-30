using System.ComponentModel.DataAnnotations;

namespace smart_marketplace_new.dto;

public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;
}
