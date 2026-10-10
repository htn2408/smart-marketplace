namespace smart_marketplace_new.dto;

// POST /api/auth/login — 200
// Token có payload { id, role } — giống hệt bản Node để frontend dùng lại không đổi.
public class LoginResponse
{
    public string Token { get; set; } = null!;

    public UserInfo User { get; set; } = null!;

    public class UserInfo
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
    }
}
