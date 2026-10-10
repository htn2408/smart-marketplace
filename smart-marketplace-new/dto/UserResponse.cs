namespace smart_marketplace_new.dto;

// User trả về cho client — KHÔNG bao giờ chứa password hay balance.
// Cột "createdAt"/"updatedAt" giữ nguyên tên Prisma để FE dễ dùng.
public class UserResponse
{
    public string Id { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = null!;
    public string? Address { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTime CreatedAt { get; set; }
}
