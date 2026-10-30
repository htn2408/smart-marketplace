namespace smart_marketplace_new.dto;

// POST /api/auth/register — 201
public class RegisterResponse
{
    public string Message { get; set; } = "Đăng ký thành công.";
    public UserResponse User { get; set; } = null!;
}
