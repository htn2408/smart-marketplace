using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// 3. Bảng Danh mục kỹ năng
[Table("skill_categories")]
public class SkillCategory
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = null!;

    public ICollection<Skill> Skills { get; set; } = new List<Skill>();
}
