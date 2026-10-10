using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace smart_marketplace_new.dto;

// Body của POST /api/tasks (multipart/form-data, kèm images[]).
// Theo mô hình giá hiện tại của schema: expectedTime (PHÚT) + offeredPrice (trọn gói VND).
// clientId KHÔNG nằm ở đây — lấy từ claim "id" của JWT (chống tạo task hộ người khác).
public class CreateTaskRequest
{
    [Required(ErrorMessage = "Title là bắt buộc.")]
    [MaxLength(255, ErrorMessage = "Title tối đa 255 ký tự.")]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    [Required(ErrorMessage = "City là bắt buộc.")]
    [MaxLength(100, ErrorMessage = "City tối đa 100 ký tự.")]
    public string City { get; set; } = null!;

    [Required(ErrorMessage = "District là bắt buộc.")]
    [MaxLength(100, ErrorMessage = "District tối đa 100 ký tự.")]
    public string District { get; set; } = null!;

    public string? Address { get; set; }

    // decimal(10,8) chỉ chứa tối đa 99.99999999 — vĩ độ vượt 90 là dữ liệu sai
    [Range(-90, 90, ErrorMessage = "Latitude phải trong khoảng -90 đến 90.")]
    public decimal? Latitude { get; set; }

    // decimal(11,8) chứa tối đa 999.99999999 — kinh độ vượt 180 là dữ liệu sai
    [Range(-180, 180, ErrorMessage = "Longitude phải trong khoảng -180 đến 180.")]
    public decimal? Longitude { get; set; }

    [Required(ErrorMessage = "ScheduledStartTime là bắt buộc.")]
    public DateTime ScheduledStartTime { get; set; }

    // Thời lượng dự kiến, đơn vị PHÚT: 15 phút → 1 ngày
    [Range(15, 1440, ErrorMessage = "ExpectedTime phải từ 15 đến 1440 phút.")]
    public int ExpectedTime { get; set; }

    // Giá TRỌN task (VND): 1.000đ → 100 triệu
    [Range(1000, 100000000, ErrorMessage = "OfferedPrice phải từ 1.000 đến 100.000.000 VNĐ.")]
    public decimal OfferedPrice { get; set; }

    [Required(ErrorMessage = "RequiredSkillId là bắt buộc.")]
    public string RequiredSkillId { get; set; } = null!;

    // Ảnh tình trạng công việc: tối đa 10, mỗi ảnh ≤ 5MB, chỉ image/*
    // (giới hạn chặn lại ở service để trả thông báo tiếng Việt thống nhất)
    public List<IFormFile> Images { get; set; } = new();
}
