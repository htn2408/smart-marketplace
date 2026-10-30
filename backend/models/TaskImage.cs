using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// 7. Bảng lưu hình ảnh tình trạng công việc
[Table("task_images")]
public class TaskImage
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [Column("image_url")]
    public string ImageUrl { get; set; } = null!;

    [Required]
    [Column("task_id", TypeName = "varchar(36)")]
    public string TaskId { get; set; } = null!;

    public TaskItem Task { get; set; } = null!;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
