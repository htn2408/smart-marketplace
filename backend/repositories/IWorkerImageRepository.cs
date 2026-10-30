using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

// Repository truy vấn bảng worker_images theo chuẩn rule.md
public interface IWorkerImageRepository
{
    Task<List<WorkerImage>> GetByWorkerProfileIdAsync(string workerProfileId, CancellationToken ct = default);
    Task<WorkerImage?> FindByIdAsync(string id, CancellationToken ct = default);
    Task AddAsync(WorkerImage image, CancellationToken ct = default);
    void Remove(WorkerImage image);
    Task<int> SaveAsync(CancellationToken ct = default);
}
