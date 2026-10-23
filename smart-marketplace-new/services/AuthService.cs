using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.auth;
using smart_marketplace_new.dto;
using smart_marketplace_new.models;
using smart_marketplace_new.repositories;

namespace smart_marketplace_new.services;

// Business logic của auth — hỗ trợ đa role qua bảng user_roles (JOIN từ UserRepository).
public class AuthService(IUserRepository users, IJwtTokenService tokenService, IImageStorage imageStorage) : IAuthService
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
            UserRoles = new List<UserRole>
            {
                new() { Role = Role.CLIENT }
            }
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

        var roleNames = GetRoleNames(user);
        var primaryRole = GetPrimaryRole(roleNames);

        return new LoginResponse
        {
            Token = tokenService.CreateToken(user.Id, roleNames),
            User = new LoginResponse.UserInfo
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = primaryRole,
                Roles = roleNames,
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

        if (request.AvatarUrl != null)
        {
            user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
        }

        user.UpdatedAt = DateTime.UtcNow;
        await users.SaveAsync(ct);

        return ToResponse(user);
    }

    public async Task<UserResponse> UpdateAvatarAsync(string userId, Microsoft.AspNetCore.Http.IFormFile file, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
        {
            throw new BusinessValidationException("Vui lòng chọn file hình ảnh đại diện.");
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            throw new BusinessValidationException($"Ảnh \"{file.FileName}\" vượt quá giới hạn 5 MB.");
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessValidationException("Chỉ chấp nhận file hình ảnh (image/*).");
        }

        var user = await users.FindByIdAsync(userId, ct)
            ?? throw new InvalidCredentialsException("Người dùng không tồn tại.");

        await using var stream = file.OpenReadStream();
        var uploadResult = await imageStorage.UploadAsync(stream, file.FileName, file.ContentType, ct);

        var oldAvatarUrl = user.AvatarUrl;
        user.AvatarUrl = uploadResult.Url;
        user.UpdatedAt = DateTime.UtcNow;

        await users.SaveAsync(ct);

        // Best-effort cleanup ảnh avatar cũ trên Cloudinary
        if (!string.IsNullOrEmpty(oldAvatarUrl))
        {
            try { await imageStorage.DestroyAsync(oldAvatarUrl, ct); } catch { }
        }

        return ToResponse(user);
    }

    public async Task<UserResponse> UpdateWorkerProfileAsync(string userId, UpdateWorkerProfileRequest request, CancellationToken ct = default)
    {
        var districts = request.ServiceDistricts?.Select(d => new WorkerDistrict
        {
            ProvinceCode = d.ProvinceCode,
            ProvinceName = d.ProvinceName,
            DistrictCode = d.DistrictCode,
            DistrictName = d.DistrictName,
        }).ToList();

        await users.UpdateWorkerProfileAsync(userId, request.Description, request.Status, request.SkillIds, districts, ct);

        var updatedUser = await users.FindByIdAsync(userId, ct)
            ?? throw new InvalidCredentialsException("Người dùng không tồn tại.");

        var roleNames = GetRoleNames(updatedUser);
        var response = ToResponse(updatedUser);
        response.Token = tokenService.CreateToken(updatedUser.Id, roleNames);
        return response;
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

    private static List<string> GetRoleNames(User user)
    {
        var roles = user.UserRoles
            .Select(ur => ur.Role.ToString())
            .Distinct()
            .ToList();

        if (roles.Count == 0)
        {
            roles.Add(Role.CLIENT.ToString());
        }

        return roles;
    }

    private static string GetPrimaryRole(List<string> roles)
    {
        if (roles.Contains(Role.ADMIN.ToString())) return Role.ADMIN.ToString();
        if (roles.Contains(Role.TASKER.ToString())) return Role.TASKER.ToString();
        return Role.CLIENT.ToString();
    }

    private static UserResponse ToResponse(User user)
    {
        var roleNames = GetRoleNames(user);
        return new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            Role = GetPrimaryRole(roleNames),
            Roles = roleNames,
            Address = user.Address,
            Latitude = user.Latitude,
            Longitude = user.Longitude,
            Balance = user.Balance,
            HeldBalance = user.HeldBalance,
            CreatedAt = user.CreatedAt,
            WorkerProfile = user.WorkerProfile is null
                ? null
                : new UserResponse.WorkerProfileDto
                {
                    Id = user.WorkerProfile.Id,
                    Description = user.WorkerProfile.Description,
                    Status = user.WorkerProfile.Status,
                    Rating = user.WorkerProfile.Rating,
                    CompletedTasks = user.WorkerProfile.CompletedTasks,
                    Skills = user.WorkerProfile.Skills
                        .Where(ws => ws.Skill is not null)
                        .Select(ws => new UserResponse.WorkerSkillDto
                        {
                            SkillId = ws.SkillId,
                            SkillName = ws.Skill.Name,
                            CategoryName = ws.Skill.Category?.Name,
                        })
                        .ToList(),
                    ServiceDistricts = user.WorkerProfile.ServiceDistricts
                        .Select(wd => new UserResponse.WorkerDistrictDto
                        {
                            Id = wd.Id,
                            ProvinceCode = wd.ProvinceCode,
                            ProvinceName = wd.ProvinceName,
                            DistrictCode = wd.DistrictCode,
                            DistrictName = wd.DistrictName,
                        })
                        .ToList(),
                    GalleryImages = user.WorkerProfile.GalleryImages
                        .OrderByDescending(gi => gi.CreatedAt)
                        .Select(gi => new WorkerImageResponse
                        {
                            Id = gi.Id,
                            ImageUrl = gi.ImageUrl,
                            Title = gi.Title,
                            Tag = gi.Tag,
                            Location = gi.Location,
                            CreatedAt = gi.CreatedAt,
                        })
                        .ToList(),
                },
        };
    }
}
