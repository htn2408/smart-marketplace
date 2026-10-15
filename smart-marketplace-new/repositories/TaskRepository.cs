using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

public class TaskRepository(AppDbContext db) : ITaskRepository
{
    public Task<Skill?> FindSkillByIdAsync(string skillId, CancellationToken ct = default) =>
        db.Skills.FirstOrDefaultAsync(s => s.Id == skillId, ct);

    public Task<User?> FindUserByIdAsync(string userId, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

    public Task<TaskItem?> FindTaskWithDetailsByIdAsync(string taskId, CancellationToken ct = default) =>
        db.Tasks
            .Include(t => t.RequiredSkill)
            .Include(t => t.Client)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

    public async Task<List<WorkerProfile>> GetCandidateWorkersAsync(
        string requiredSkillId,
        string taskCity,
        string taskDistrict,
        string? provinceCode,
        string? districtCode,
        DateTime taskStart,
        DateTime taskEnd,
        CancellationToken ct = default)
    {
        var normalizedCity = taskCity.Trim().ToLower();
        var normalizedDistrict = taskDistrict.Trim().ToLower();

        // Ưu tiên so mã hành chính (ổn định, không phụ thuộc dấu/định dạng tên);
        // task cũ chưa có code thì fallback so tên như trước.
        var useCodeMatching = !string.IsNullOrEmpty(provinceCode) && !string.IsNullOrEmpty(districtCode);

        // Lọc trùng lịch ngay trong SQL: task MATCHED/IN_PROGRESS của worker
        // phải không overlap [taskStart, taskEnd)
        return await db.WorkerProfiles
            .Include(wp => wp.User)
            .Include(wp => wp.Skills)
                .ThenInclude(ws => ws.Skill)
            .Include(wp => wp.ServiceDistricts)
            .AsNoTracking()
            .Where(wp =>
                wp.Status == "ONLINE" &&
                wp.Skills.Any(ws => ws.SkillId == requiredSkillId) &&
                wp.ServiceDistricts.Any(wd =>
                    useCodeMatching
                        ? wd.ProvinceCode == provinceCode && wd.DistrictCode == districtCode
                        : wd.ProvinceName.ToLower() == normalizedCity &&
                          wd.DistrictName.ToLower() == normalizedDistrict) &&
                !wp.TasksAccepted.Any(t =>
                    (t.Status == TaskItemStatus.MATCHED || t.Status == TaskItemStatus.IN_PROGRESS) &&
                    t.ScheduledStartTime < taskEnd &&
                    t.ScheduledStartTime.AddMinutes(t.ExpectedTime) > taskStart))
            .ToListAsync(ct);
    }

    // Task + TaskImages được Add cùng lúc; 1 lần SaveAsync duy nhất ở service
    // → EF Core bọc cả hai trong đúng 1 transaction tự động (tương đương $transaction của Prisma).
    public async Task AddAsync(TaskItem task, CancellationToken ct = default) =>
        await db.Tasks.AddAsync(task, ct);

    public Task<int> SaveAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);

    public async Task<List<Skill>> GetSkillSuggestionsAsync(string? query, int limit, CancellationToken ct = default)
    {
        var q = db.Skills.Include(s => s.Category).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var keyword = $"%{query.Trim()}%";
            q = q.Where(s => EF.Functions.Like(s.Name, keyword) || EF.Functions.Like(s.Category.Name, keyword));
        }

        return await q.OrderBy(s => s.Name).Take(limit).ToListAsync(ct);
    }
}
