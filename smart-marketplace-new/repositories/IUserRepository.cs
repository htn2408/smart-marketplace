using smart_marketplace_new.models;

namespace smart_marketplace_new.repositories;

// Repository truy cập dữ liệu User.
// Service chỉ gọi interface này, không đụng DbContext trực tiếp
// → có thể mock khi unit test business logic.
public interface IUserRepository
{
    Task<User?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> FindByIdAsync(string id, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> ExistsByPhoneAsync(string phoneNumber, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
    Task UpdateWorkerProfileAsync(
        string userId,
        string? description,
        string? status,
        List<string>? skillIds,
        List<WorkerDistrict>? districts,
        CancellationToken ct = default);

    // Lưu thay đổi xuống DB. Service gọi để chủ động bắt DbUpdateException (race duplicate).
    Task<int> SaveAsync(CancellationToken ct = default);
}
