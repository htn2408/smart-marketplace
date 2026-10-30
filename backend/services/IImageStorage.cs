namespace smart_marketplace_new.services;

// Kết quả upload trả về cho service: đường dẫn public của ảnh
public record UploadedImage(string Url);

// Abstraction lưu trữ ảnh — tách service khỏi nhà cung cấp cụ thể (Cloudinary).
// Ưu điểm:
//   - TaskService không phụ thuộc SDK Cloudinary → mock được khi unit test
//   - Đổi provider (S3, Azure Blob, local disk) không phải sửa TaskService
//   - Cleanup ảnh khi tạo task thất bại gọi DestroyAsync qua cùng interface
public interface IImageStorage
{
    // Upload 1 ảnh, trả về URL public
    Task<UploadedImage> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct = default);

    // Xoá ảnh theo URL (dùng khi rollback)
    Task DestroyAsync(string url, CancellationToken ct = default);
}
