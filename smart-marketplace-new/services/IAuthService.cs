using smart_marketplace_new.dto;

namespace smart_marketplace_new.services;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<UserResponse> GetProfileAsync(string userId, CancellationToken ct = default);
    Task<UserResponse> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<UserResponse> UpdateAvatarAsync(string userId, Microsoft.AspNetCore.Http.IFormFile file, CancellationToken ct = default);
    Task<UserResponse> UpdateWorkerProfileAsync(string userId, UpdateWorkerProfileRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
    Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
}
