using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// 5. Bảng trung gian Thợ - Kỹ năng
// Khóa chính tổng hợp (WorkerProfileId, SkillId) sẽ được cấu hình bằng Fluent API trong DbContext
[Table("worker_skills")]
public class WorkerSkill
{
    [Column("worker_profile_id", TypeName = "varchar(36)")]
    public string WorkerProfileId { get; set; } = null!;

    [Column("skill_id", TypeName = "varchar(36)")]
    public string SkillId { get; set; } = null!;

    public WorkerProfile WorkerProfile { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
