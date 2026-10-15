namespace smart_marketplace_new.dto;

// Hồ sơ public của Tasker cho client xem trước khi gửi offer (GET /api/workers/{userId}).
// Không chứa PII (email/phone) — chỉ thông tin nghề nghiệp.
public class WorkerPublicProfileResponse
{
    public string UserId { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = "ONLINE";
    public decimal Rating { get; set; }
    public int CompletedTasks { get; set; }
    public DateTime? MemberSince { get; set; }
    public List<SkillDto> Skills { get; set; } = new();
    public List<DistrictDto> ServiceDistricts { get; set; } = new();

    public class SkillDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class DistrictDto
    {
        public string ProvinceCode { get; set; } = null!;
        public string ProvinceName { get; set; } = null!;
        public string DistrictCode { get; set; } = null!;
        public string DistrictName { get; set; } = null!;
    }
}
