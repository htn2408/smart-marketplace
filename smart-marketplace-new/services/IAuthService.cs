using smart_marketplace_new.dto;

namespace smart_marketplace_new.services;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<UserResponse> GetProfileAsync(string userId, CancellationToken ct = default);
}
