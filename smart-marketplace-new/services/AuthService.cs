using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.auth;
using smart_marketplace_new.dto;
using smart_marketplace_new.models;
using smart_marketplace_new.repositories;

namespace smart_marketplace_new.services;

// Business logic của auth — port 1:1 từ AuthController trước đây,
// giữ nguyên các fix: login theo email, chống timing attack,
// race duplicate → DuplicateResourceException (409 ở exception handler).
public class AuthService(IUserRepository users, IJwtTokenService tokenService) : IAuthService
{
    // Hash dummy để so khi email không tồn tại — thời gian phản hồi như bcrypt thật,
    // chặn dò email tồn tại qua timing (side-channel).
    private const string DummyHash =
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        // Check trùng để trả thông báo thân thiện (race vẫn được unique constraint chặn ở dưới)
        if (await users.ExistsByEmailAsync(email, ct))
            throw new DuplicateResourceException("Email này đã được sử dụng.");

        if (await users.ExistsByPhoneAsync(request.PhoneNumber, ct))
            throw new DuplicateResourceException("Số điện thoại này đã được sử dụng.");

        var user = new User
        {
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Name = request.Name.Trim(),
            PhoneNumber = request.PhoneNumber,
            Role = Role.CLIENT,
        };

        await users.AddAsync(user, ct);
        try
        {
            await users.SaveAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlConnector.MySqlException { Number: 1062 })
        {
            // 2 request đăng ký cùng lúc: unique constraint của DB thắng cuộc đua.
            // Chỉ bắt đúng lỗi duplicate, lỗi khác ném ra thành 500.
            throw new DuplicateResourceException("Email hoặc số điện thoại này đã được sử dụng.");
        }

        return new RegisterResponse { User = ToResponse(user) };
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await users.FindByEmailAsync(email, ct);
        // Luôn chạy bcrypt (dù user không tồn tại) để thời gian phản hồi như nhau
        var isPasswordMatch = await Task.Run(() =>
            BCrypt.Net.BCrypt.Verify(request.Password, user?.Password ?? DummyHash), ct);

        // Một thông báo chung cho cả email sai và mật khẩu sai
        if (user is null || !isPasswordMatch)
        {
            throw new InvalidCredentialsException("Email hoặc mật khẩu không đúng.");
        }

        return new LoginResponse
        {
            Token = tokenService.CreateToken(user.Id, user.Role.ToString()),
            User = new LoginResponse.UserInfo
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
            },
        };
    }

    public async Task<UserResponse> GetProfileAsync(string userId, CancellationToken ct = default)
    {
        var user = await users.FindByIdAsync(userId, ct)
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        return ToResponse(user);
    }

    public async Task<UserResponse> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await users.FindByIdAsync(userId, ct)
            ?? throw new InvalidCredentialsException("Người dùng không tồn tại.");

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            user.Name = request.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber) && request.PhoneNumber != user.PhoneNumber)
        {
            if (await users.ExistsByPhoneAsync(request.PhoneNumber, ct))
                throw new DuplicateResourceException("Số điện thoại này đã được sử dụng.");
            user.PhoneNumber = request.PhoneNumber.Trim();
        }

        if (request.Address != null)
        {
            user.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        }

        if (request.Latitude.HasValue) user.Latitude = request.Latitude;
        if (request.Longitude.HasValue) user.Longitude = request.Longitude;

        user.UpdatedAt = DateTime.UtcNow;
        await users.SaveAsync(ct);

        return ToResponse(user);
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await users.FindByIdAsync(userId, ct)
            ?? throw new InvalidCredentialsException("Người dùng không tồn tại.");

        var isOldPasswordMatch = await Task.Run(() =>
            BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password), ct);

        if (!isOldPasswordMatch)
        {
            throw new BusinessValidationException("Mật khẩu cũ không chính xác.");
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await users.SaveAsync(ct);
    }

    private static UserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role.ToString(),
        Address = user.Address,
        Latitude = user.Latitude,
        Longitude = user.Longitude,
        CreatedAt = user.CreatedAt,
    };
}
