using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace smart_marketplace_new.dto;

public class WorkerImageResponse
{
    public string Id { get; set; } = null!;
    public string ImageUrl { get; set; } = null!;
    public string? Title { get; set; }
    public string? Tag { get; set; }
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateWorkerImageRequest
{
    [MaxLength(255, ErrorMessage = "Tiêu đề không được vượt quá 255 ký tự.")]
    public string? Title { get; set; }

    [MaxLength(100, ErrorMessage = "Chuyên môn/Tag không được vượt quá 100 ký tự.")]
    public string? Tag { get; set; }

    [MaxLength(255, ErrorMessage = "Địa điểm không được vượt quá 255 ký tự.")]
    public string? Location { get; set; }

    // Hỗ trợ upload file ảnh trực tiếp (multipart/form-data)
    public IFormFile? File { get; set; }

    // Hoặc truyền đường dẫn URL ảnh
    public string? ImageUrl { get; set; }
}
