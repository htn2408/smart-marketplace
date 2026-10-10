using System.ComponentModel.DataAnnotations;

namespace smart_marketplace_new.dto;

// Request body cho POST /api/auth/login.
// Fix bug của bản JS: đăng nhập theo EMAIL (cột unique), không phải name.
public class LoginRequest
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Password là bắt buộc.")]
    public string Password { get; set; } = null!;
}
