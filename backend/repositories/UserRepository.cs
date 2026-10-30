using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> FindByEmailAsync(string email, CancellationToken ct = default) =>
        db.Users
            .Include(u => u.UserRoles)
            .Include(u => u.WorkerProfile)
                .ThenInclude(wp => wp!.Skills)
                    .ThenInclude(ws => ws.Skill)
                        .ThenInclude(s => s.Category)
            .Include(u => u.WorkerProfile)
                .ThenInclude(wp => wp!.ServiceDistricts)
            .Include(u => u.WorkerProfile)
                .ThenInclude(wp => wp!.GalleryImages)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<User?> FindByIdAsync(string id, CancellationToken ct = default) =>
        db.Users
            .Include(u => u.UserRoles)
            .Include(u => u.WorkerProfile)
                .ThenInclude(wp => wp!.Skills)
                    .ThenInclude(ws => ws.Skill)
                        .ThenInclude(s => s.Category)
            .Include(u => u.WorkerProfile)
                .ThenInclude(wp => wp!.ServiceDistricts)
            .Include(u => u.WorkerProfile)
                .ThenInclude(wp => wp!.GalleryImages)
            .FirstOrDefaultAsync(u => u.Id == id || (u.WorkerProfile != null && u.WorkerProfile.Id == id), ct);

    public Task<WorkerProfile?> FindWorkerProfileByUserIdAsync(string userId, CancellationToken ct = default) =>
        db.WorkerProfiles
            .Include(wp => wp.User)
            .Include(wp => wp.Skills)
                .ThenInclude(ws => ws.Skill)
            .Include(wp => wp.ServiceDistricts)
            .Include(wp => wp.GalleryImages)
            .AsNoTracking()
            .FirstOrDefaultAsync(wp => wp.UserId == userId, ct);

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default) =>
        db.Users.AnyAsync(u => u.Email == email, ct);

    public Task<bool> ExistsByPhoneAsync(string phoneNumber, CancellationToken ct = default) =>
        db.Users.AnyAsync(u => u.PhoneNumber == phoneNumber, ct);

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await db.Users.AddAsync(user, ct);

    public async Task UpdateWorkerProfileAsync(
        string userId,
        string? description,
        string? status,
        List<string>? skillIds,
        List<WorkerDistrict>? districts,
        CancellationToken ct = default)
    {
        var profile = await db.WorkerProfiles
            .Include(wp => wp.Skills)
            .Include(wp => wp.ServiceDistricts)
            .FirstOrDefaultAsync(wp => wp.UserId == userId, ct);

        var normalizedStatus = !string.IsNullOrWhiteSpace(status)
            ? status.Trim().ToUpperInvariant()
            : null;

        if (profile is null)
        {
            profile = new WorkerProfile
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Description = description?.Trim(),
                Status = normalizedStatus ?? "ONLINE",
                Rating = 5.00m,
                CompletedTasks = 0,
            };
            await db.WorkerProfiles.AddAsync(profile, ct);
        }
        else
        {
            if (description is not null)
            {
                profile.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
            }

            if (normalizedStatus is not null)
            {
                profile.Status = normalizedStatus;
            }
        }

        // Đảm bảo user có quyền TASKER trong user_roles
        var hasTaskerRole = await db.UserRoles
            .AnyAsync(ur => ur.UserId == userId && ur.Role == Role.TASKER, ct);
        if (!hasTaskerRole)
        {
            await db.UserRoles.AddAsync(new UserRole { UserId = userId, Role = Role.TASKER }, ct);
        }

        // Cập nhật danh sách kỹ năng (worker_skills)
        if (skillIds is not null)
        {
            var validSkillIds = await db.Skills
                .Where(s => skillIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync(ct);

            db.WorkerSkills.RemoveRange(profile.Skills);
            profile.Skills = validSkillIds.Distinct().Select(sid => new WorkerSkill
            {
                WorkerProfileId = profile.Id,
                SkillId = sid,
            }).ToList();
        }

        // Cập nhật danh sách Quận/Huyện hoạt động (worker_districts)
        if (districts is not null)
        {
            db.WorkerDistricts.RemoveRange(profile.ServiceDistricts);
            profile.ServiceDistricts = districts
                .GroupBy(d => d.DistrictCode)
                .Select(g => g.First())
                .Select(d => new WorkerDistrict
                {
                    Id = Guid.NewGuid().ToString(),
                    WorkerProfileId = profile.Id,
                    ProvinceCode = d.ProvinceCode,
                    ProvinceName = d.ProvinceName,
                    DistrictCode = d.DistrictCode,
                    DistrictName = d.DistrictName,
                })
                .ToList();
        }

        await db.SaveChangesAsync(ct);
    }

    public Task<int> SaveAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
