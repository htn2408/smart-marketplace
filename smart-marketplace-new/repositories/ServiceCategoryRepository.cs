using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

public class ServiceCategoryRepository(AppDbContext db) : IServiceCategoryRepository
{
    public Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default) =>
        db.SkillCategories.AnyAsync(c => c.Name == name, ct);

    public async Task AddCategoryAsync(SkillCategory category, CancellationToken ct = default) =>
        await db.SkillCategories.AddAsync(category, ct);

    public Task<int> SaveAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);

    public Task<List<SkillCategory>> GetAllWithSkillsAsync(CancellationToken ct = default) =>
        db.SkillCategories
            .Include(c => c.Skills)
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

    public Task<SkillCategory?> GetByIdWithSkillsAsync(string id, CancellationToken ct = default) =>
        db.SkillCategories
            .Include(c => c.Skills)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);
}
