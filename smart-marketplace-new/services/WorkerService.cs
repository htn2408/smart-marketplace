using smart_marketplace_new.dto;
using smart_marketplace_new.repositories;

namespace smart_marketplace_new.services;

public interface IWorkerService
{
    Task<WorkerPublicProfileResponse> GetPublicProfileAsync(string userId, CancellationToken ct = default);
}

// Hồ sơ public của Tasker cho client xem (GET /api/workers/{userId})
public class WorkerService(IUserRepository users) : IWorkerService
{
    public async Task<WorkerPublicProfileResponse> GetPublicProfileAsync(string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new BusinessValidationException("userId là bắt buộc.");
        }

        var wp = await users.FindWorkerProfileByUserIdAsync(userId.Trim(), ct)
            ?? throw new NotFoundException("Không tìm thấy Tasker.");

        return new WorkerPublicProfileResponse
        {
            UserId = wp.UserId,
            Name = wp.User.Name,
            Description = wp.Description,
            Status = wp.Status,
            Rating = wp.Rating,
            CompletedTasks = wp.CompletedTasks,
            MemberSince = wp.User.CreatedAt,
            Skills = wp.Skills
                .Where(ws => ws.Skill is not null)
                .Select(ws => new WorkerPublicProfileResponse.SkillDto
                {
                    Id = ws.SkillId,
                    Name = ws.Skill.Name,
                })
                .ToList(),
            ServiceDistricts = wp.ServiceDistricts
                .Select(wd => new WorkerPublicProfileResponse.DistrictDto
                {
                    ProvinceCode = wd.ProvinceCode,
                    ProvinceName = wd.ProvinceName,
                    DistrictCode = wd.DistrictCode,
                    DistrictName = wd.DistrictName,
                })
                .ToList(),
        };
    }
}
