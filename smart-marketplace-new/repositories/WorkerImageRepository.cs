using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

// Cài đặt IWorkerImageRepository theo chuẩn rule.md
public class WorkerImageRepository(AppDbContext db) : IWorkerImageRepository
{
    public Task<List<WorkerImage>> GetByWorkerProfileIdAsync(string workerProfileId, CancellationToken ct = default) =>
        db.WorkerImages
            .Where(wi => wi.WorkerProfileId == workerProfileId)
            .OrderByDescending(wi => wi.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

    public Task<WorkerImage?> FindByIdAsync(string id, CancellationToken ct = default) =>
        db.WorkerImages
            .Include(wi => wi.WorkerProfile)
            .FirstOrDefaultAsync(wi => wi.Id == id, ct);

    public async Task AddAsync(WorkerImage image, CancellationToken ct = default) =>
        await db.WorkerImages.AddAsync(image, ct);

    public void Remove(WorkerImage image) =>
        db.WorkerImages.Remove(image);

    public Task<int> SaveAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
