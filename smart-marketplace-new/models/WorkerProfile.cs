using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// 2. Bảng Profile riêng của Thợ
[Table("worker_profiles")]
public class WorkerProfile
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [Column("user_id", TypeName = "varchar(36)")]
    public string UserId { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    [Column("city")]
    public string City { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    [Column("district")]
    public string District { get; set; } = null!;

    [Column("rating", TypeName = "decimal(3,2)")]
    public decimal Rating { get; set; } = 5.00m;

    [Column("completed_tasks")]
    public int CompletedTasks { get; set; } = 0;

    public User User { get; set; } = null!;
    public ICollection<WorkerSkill> Skills { get; set; } = new List<WorkerSkill>();

    [InverseProperty("WorkerProfile")]
    public ICollection<TaskItem> TasksAccepted { get; set; } = new List<TaskItem>();
}
