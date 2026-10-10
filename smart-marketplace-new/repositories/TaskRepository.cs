using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

public class TaskRepository(AppDbContext db) : ITaskRepository
{
    public Task<Skill?> FindSkillByIdAsync(string skillId, CancellationToken ct = default) =>
        db.Skills.FirstOrDefaultAsync(s => s.Id == skillId, ct);

    public Task<User?> FindUserByIdAsync(string userId, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

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
