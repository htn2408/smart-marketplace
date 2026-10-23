using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

[Table("users")]
public class User
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = null!;

    [Required]
    [MaxLength(255)]
    [Column("password")]
    public string Password { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = null!;

    [MaxLength(20)]
    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [MaxLength(500)]
    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Số dư tài khoản mặc định 1.000.000 VNĐ khi tạo User
    [Column("balance", TypeName = "decimal(12,2)")]
    public decimal Balance { get; set; } = 1000000.00m;

    [Column("held_balance", TypeName = "decimal(12,2)")]
    public decimal HeldBalance { get; set; } = 0.00m;

    // Địa chỉ và toạ độ của User
    [Column("address")]
    public string? Address { get; set; }

    [Column("latitude", TypeName = "decimal(10,8)")]
    public decimal? Latitude { get; set; }

    [Column("longitude", TypeName = "decimal(11,8)")]
    public decimal? Longitude { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Quan hệ 1-n: Một User có thể giữ nhiều Role (CLIENT, TASKER, ADMIN) trong bảng user_roles
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    // Quan hệ 1-1:
    // Nếu user có role TASKER thì sẽ có thêm profile này
    public WorkerProfile? WorkerProfile { get; set; }

    // Khách đăng task
    [InverseProperty("Client")]
    public ICollection<TaskItem> TasksPosted { get; set; } = new List<TaskItem>();
}
