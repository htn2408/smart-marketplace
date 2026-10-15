using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

public interface ITaskRepository
{
    Task<Skill?> FindSkillByIdAsync(string skillId, CancellationToken ct = default);
    Task<User?> FindUserByIdAsync(string userId, CancellationToken ct = default);
    Task<TaskItem?> FindTaskWithDetailsByIdAsync(string taskId, CancellationToken ct = default);
    Task<List<WorkerProfile>> GetCandidateWorkersAsync(
        string requiredSkillId,
        string taskCity,
        string taskDistrict,
        string? provinceCode,
        string? districtCode,
        DateTime taskStart,
        DateTime taskEnd,
        CancellationToken ct = default);
    Task AddAsync(TaskItem task, CancellationToken ct = default);
    Task<int> SaveAsync(CancellationToken ct = default);
    Task<List<Skill>> GetSkillSuggestionsAsync(string? query, int limit, CancellationToken ct = default);
}
