using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using smart_marketplace_new.dto;
using smart_marketplace_new.services;

namespace smart_marketplace_new.controllers;

// Controller mỏng: chỉ nhận request → gọi service → trả response.
// Validate qua DataAnnotations của DTO ([ApiController] tự trả 400),
// exception nghiệp vụ do GlobalExceptionHandler map thành 401/409/500.
[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await auth.RegisterAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        return Ok(await auth.LoginAsync(request, ct));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> Me(CancellationToken ct)
    {
        var id = User.FindFirst("id")?.Value;
        if (id is null)
        {
            return Unauthorized(new { error = "Token không hợp lệ." });
        }

        return Ok(await auth.GetProfileAsync(id, ct));
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> UpdateProfile(UpdateProfileRequest request, CancellationToken ct)
    {
        var id = User.FindFirst("id")?.Value;
        if (id is null)
        {
            return Unauthorized(new { error = "Token không hợp lệ." });
        }

        var result = await auth.UpdateProfileAsync(id, request, ct);
        return Ok(result);
    }

    [HttpPost("avatar")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UserResponse>> UpdateAvatar(IFormFile file, CancellationToken ct)
    {
        var id = User.FindFirst("id")?.Value;
        if (id is null)
        {
            return Unauthorized(new { error = "Token không hợp lệ." });
        }

        var result = await auth.UpdateAvatarAsync(id, file, ct);
        return Ok(result);
    }

    [HttpPut("worker-profile")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> UpdateWorkerProfile(UpdateWorkerProfileRequest request, CancellationToken ct)
    {
        var id = User.FindFirst("id")?.Value;
        if (id is null)
        {
            return Unauthorized(new { error = "Token không hợp lệ." });
        }

        var result = await auth.UpdateWorkerProfileAsync(id, request, ct);
        return Ok(result);
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        var id = User.FindFirst("id")?.Value;
        if (id is null)
        {
            return Unauthorized(new { error = "Token không hợp lệ." });
        }

        await auth.ChangePasswordAsync(id, request, ct);
        return Ok(new { message = "Đổi mật khẩu thành công." });
    }
}
