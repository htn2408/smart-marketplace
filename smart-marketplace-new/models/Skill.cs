using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// 4. Bảng Skills
[Table("skills")]
public class Skill
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = null!;

    // Lưu ý: cột trong DB giữ nguyên tên camelCase "categoryId" (schema.prisma không @map cột này)
    [Required]
    [Column("categoryId", TypeName = "varchar(36)")]
    public string CategoryId { get; set; } = null!;

    public SkillCategory Category { get; set; } = null!;
    public ICollection<WorkerSkill> Workers { get; set; } = new List<WorkerSkill>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
