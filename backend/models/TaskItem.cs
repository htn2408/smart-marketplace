using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// 6. Bảng Tasks
// (entity đặt tên TaskItem để không trùng với System.Threading.Tasks.Task)
[Table("tasks")]
public class TaskItem
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(255)]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("city")]
    public string City { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    [Column("district")]
    public string District { get; set; } = null!;

    // Mã hành chính (Esgoo) — dùng để matching worker_districts ổn định hơn so tên.
    // Nullable vì task cũ chưa có code; khi có code thì filter ưu tiên so code.
    [MaxLength(20)]
    [Column("province_code")]
    public string? ProvinceCode { get; set; }

    [MaxLength(20)]
    [Column("district_code")]
    public string? DistrictCode { get; set; }

    [Column("status")]
    public TaskItemStatus Status { get; set; } = TaskItemStatus.PENDING;

    // Địa chỉ chi tiết và toạ độ nơi làm việc
    [Column("address")]
    public string? Address { get; set; }

    [Column("latitude", TypeName = "decimal(10,8)")]
    public decimal? Latitude { get; set; }

    [Column("longitude", TypeName = "decimal(11,8)")]
    public decimal? Longitude { get; set; }

    // ==========================================
    // THỜI GIAN KHÁCH ĐẶT
    // ==========================================

    // Thời điểm khách muốn bắt đầu làm
    [Required]
    [Column("scheduled_start_time")]
    public DateTime ScheduledStartTime { get; set; }

    // Thời gian khách dự kiến Task sẽ hoàn thành.
    // Đơn vị: phút.
    //
    // Ví dụ:
    // 60  = 1 giờ
    // 90  = 1 giờ 30 phút
    // 120 = 2 giờ
    [Column("expected_time")]
    public int ExpectedTime { get; set; }

    // ==========================================
    // GIÁ KHÁCH ĐỀ XUẤT
    // ==========================================

    // Giá cho TOÀN BỘ Task.
    // Không phải giá theo giờ.
    //
    // Ví dụ:
    // expectedTime = 120
    // offeredPrice = 200000
    //
    // Nghĩa là:
    // Công việc dự kiến mất 2 giờ
    // và khách trả 200.000 VNĐ cho toàn bộ công việc.
    [Column("offered_price", TypeName = "decimal(12,2)")]
    public decimal OfferedPrice { get; set; }

    // ==========================================
    // THỜI GIAN THỰC TẾ
    // ==========================================

    // Worker bấm Start Task
    [Column("actual_start_time")]
    public DateTime? ActualStartTime { get; set; }

    // Worker bấm End Task
    [Column("actual_end_time")]
    public DateTime? ActualEndTime { get; set; }

    // ==========================================
    // CLIENT
    // ==========================================

    [Required]
    [Column("client_id", TypeName = "varchar(36)")]
    public string ClientId { get; set; } = null!;

    public User Client { get; set; } = null!;

    // ==========================================
    // SKILL
    // ==========================================

    [Required]
    [Column("required_skill_id", TypeName = "varchar(36)")]
    public string RequiredSkillId { get; set; } = null!;

    public Skill RequiredSkill { get; set; } = null!;

    // ==========================================
    // WORKER
    // ==========================================

    // NULL khi chưa có Worker được chọn
    [Column("worker_profile_id", TypeName = "varchar(36)")]
    public string? WorkerProfileId { get; set; }

    public WorkerProfile? WorkerProfile { get; set; }

    // ==========================================
    // IMAGES
    // ==========================================

    // Một Task có thể có nhiều ảnh
    public ICollection<TaskImage> Images { get; set; } = new List<TaskImage>();

    // ==========================================
    // TIMESTAMP
    // ==========================================

    [Column("offer_expires_at")]
    public DateTime? OfferExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Một Task có tối đa một Invoice
    public Invoice? Invoice { get; set; }
}
