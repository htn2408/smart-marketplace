using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace smart_marketplace_new.models;

// Bảng liên kết Thợ - Quận/Huyện hoạt động
[Table("worker_districts")]
public class WorkerDistrict
{
    [Key]
    [Column("id", TypeName = "varchar(36)")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [Column("worker_profile_id", TypeName = "varchar(36)")]
    public string WorkerProfileId { get; set; } = null!;

    [Required]
    [MaxLength(10)]
    [Column("province_code")]
    public string ProvinceCode { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    [Column("province_name")]
    public string ProvinceName { get; set; } = null!;

    [Required]
    [MaxLength(10)]
    [Column("district_code")]
    public string DistrictCode { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    [Column("district_name")]
    public string DistrictName { get; set; } = null!;

    public WorkerProfile WorkerProfile { get; set; } = null!;
}
