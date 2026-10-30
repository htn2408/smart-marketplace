using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// 8. Bảng Hóa đơn
[Table("invoices")]
public class Invoice
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [Column("task_id", TypeName = "varchar(36)")]
    public string TaskId { get; set; } = null!;

    public TaskItem Task { get; set; } = null!;

    // Tổng số tiền phải thanh toán cho toàn bộ Task.
    // Không tính theo thời gian thực tế.
    [Column("total_amount", TypeName = "decimal(12,2)")]
    public decimal TotalAmount { get; set; }

    [Column("status")]
    public InvoiceStatus Status { get; set; } = InvoiceStatus.PENDING;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }
}
