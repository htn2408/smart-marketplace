namespace smart_marketplace_new.services;

// Bản dev của IImageStorage — KHÔNG upload lên đâu cả, chỉ giả lập:
// trả về URL dạng "local://{tên-file}" và DestroyAsync là no-op.
//
// Dùng khi chưa có tài khoản Cloudinary (hiện .env của BE Node cũng chưa có
// CLOUDINARY_* credentials). Khi có tài khoản thật:
//   1. dotnet add package CloudinaryDotNet
//   2. Viết CloudinaryImageStorage : IImageStorage (upload_stream + destroy)
//   3. Đổi dòng DI trong Program.cs sang CloudinaryImageStorage
public class LocalImageStorage : IImageStorage
{
    public Task<UploadedImage> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        var ext = Path.GetExtension(fileName);
        var url = $"local://smart-marketplace/tasks/{Guid.NewGuid()}{ext}";
        return Task.FromResult(new UploadedImage(url));
    }

    public Task DestroyAsync(string url, CancellationToken ct = default) => Task.CompletedTask;
}
