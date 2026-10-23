using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// Bảng lưu thư viện hình ảnh công trình thực tế đã thi công của Thợ
[Table("worker_images")]
public class WorkerImage
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [Column("worker_profile_id", TypeName = "varchar(36)")]
    public string WorkerProfileId { get; set; } = null!;

    [Required]
    [Column("image_url", TypeName = "text")]
    public string ImageUrl { get; set; } = null!;

    [MaxLength(255)]
    [Column("title", TypeName = "varchar(255)")]
    public string? Title { get; set; }

    [MaxLength(100)]
    [Column("tag", TypeName = "varchar(100)")]
    public string? Tag { get; set; }

    [MaxLength(255)]
    [Column("location", TypeName = "varchar(255)")]
    public string? Location { get; set; }

    [Column("created_at", TypeName = "datetime(3)")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public WorkerProfile WorkerProfile { get; set; } = null!;
}
