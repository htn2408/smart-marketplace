using System.ComponentModel.DataAnnotations;

namespace smart_marketplace_new.dto;

// Request body cho POST /api/auth/register
// (port của auth.controller.js register, ValidateModelState sẽ bắt lỗi 400)
public class RegisterRequest
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    [MaxLength(255, ErrorMessage = "Email tối đa 255 ký tự.")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Password là bắt buộc.")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
    public string Password { get; set; } = null!;

    [Required(ErrorMessage = "Name là bắt buộc.")]
    [MaxLength(100, ErrorMessage = "Name tối đa 100 ký tự.")]
    public string Name { get; set; } = null!;

    [Required(ErrorMessage = "PhoneNumber là bắt buộc.")]
    [RegularExpression("^[0-9]{9,11}$", ErrorMessage = "Số điện thoại không hợp lệ.")]
    public string PhoneNumber { get; set; } = null!;
}
