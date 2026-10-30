using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

public interface IServiceCategoryRepository
{
    Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default);
    Task AddCategoryAsync(SkillCategory category, CancellationToken ct = default);
    Task<int> SaveAsync(CancellationToken ct = default);
    Task<List<SkillCategory>> GetAllWithSkillsAsync(CancellationToken ct = default);
    Task<SkillCategory?> GetByIdWithSkillsAsync(string id, CancellationToken ct = default);
}
