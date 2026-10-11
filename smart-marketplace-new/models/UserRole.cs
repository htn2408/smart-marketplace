using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// Bảng phụ user_roles (quan hệ 1-n từ User):
// 1 người dùng có thể có nhiều vai trò (ví dụ: vừa là CLIENT vừa là TASKER, hoặc ADMIN).
// Khóa chính phức hợp: (user_id, role).
[Table("user_roles")]
public class UserRole
{
    [Required]
    [Column("user_id", TypeName = "varchar(36)")]
    public string UserId { get; set; } = null!;

    [Required]
    [Column("role")]
    public Role Role { get; set; } = Role.CLIENT;

    public User User { get; set; } = null!;
}
