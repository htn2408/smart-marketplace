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
    Task<List<TaskItem>> GetTasksByWorkerProfileIdAsync(string workerProfileId, CancellationToken ct = default);
    Task<TaskItem?> FindTaskByIdTrackingAsync(string taskId, CancellationToken ct = default);
    Task<WorkerProfile?> FindWorkerProfileByUserIdTrackingAsync(string userId, CancellationToken ct = default);
    Task<WorkerProfile?> FindWorkerProfileByIdAsync(string workerProfileId, CancellationToken ct = default);
    Task<bool> HasOverlappingTaskAsync(string workerProfileId, DateTime start, DateTime end, string? excludeTaskId, CancellationToken ct = default);
    Task<List<TaskItem>> GetTasksByClientIdAsync(string clientId, CancellationToken ct = default);
    Task<List<TaskItem>> FindOverduePendingTasksAsync(DateTime now, CancellationToken ct = default);
}
