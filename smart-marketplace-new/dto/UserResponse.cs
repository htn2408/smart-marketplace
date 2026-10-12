namespace smart_marketplace_new.dto;

// User trả về cho client — KHÔNG bao giờ chứa password hay balance.
// Hỗ trợ đa role từ bảng user_roles và thông tin hồ sơ Thợ (WorkerProfile) nếu có.
public class UserResponse
{
    public string Id { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = null!;
    public List<string> Roles { get; set; } = new();
    public string? Address { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTime CreatedAt { get; set; }
    public WorkerProfileDto? WorkerProfile { get; set; }

    public class WorkerProfileDto
    {
        public string Id { get; set; } = null!;
        public string? Description { get; set; }
        public string Status { get; set; } = "ONLINE";
        public decimal Rating { get; set; }
        public int CompletedTasks { get; set; }
        public List<WorkerSkillDto> Skills { get; set; } = new();
        public List<WorkerDistrictDto> ServiceDistricts { get; set; } = new();
    }

    public class WorkerSkillDto
    {
        public string SkillId { get; set; } = null!;
        public string SkillName { get; set; } = null!;
        public string? CategoryName { get; set; }
    }

    public class WorkerDistrictDto
    {
        public string Id { get; set; } = null!;
        public string ProvinceCode { get; set; } = null!;
        public string ProvinceName { get; set; } = null!;
        public string DistrictCode { get; set; } = null!;
        public string DistrictName { get; set; } = null!;
    }
}
