namespace smart_marketplace_new.dto;

// PUT /api/auth/worker-profile — Cập nhật hồ sơ năng lực Thợ (CV Tasker):
// - Description (Giới thiệu bản thân)
// - SkillIds (Danh sách kỹ năng chuyên môn trong worker_skills)
// - ServiceDistricts (Danh sách Quận/Huyện hoạt động trong worker_districts)
public class UpdateWorkerProfileRequest
{
    public string? Description { get; set; }

    public List<string>? SkillIds { get; set; }

    public List<DistrictInput>? ServiceDistricts { get; set; }

    public class DistrictInput
    {
        public string ProvinceCode { get; set; } = null!;
        public string ProvinceName { get; set; } = null!;
        public string DistrictCode { get; set; } = null!;
        public string DistrictName { get; set; } = null!;
    }
}
