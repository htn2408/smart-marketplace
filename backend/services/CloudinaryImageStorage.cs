using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace smart_marketplace_new.services;

/// <summary>
/// Dịch vụ lưu trữ ảnh đám mây qua Cloudinary CDN (Production / Cloud Storage)
/// Triển khai IImageStorage theo chuẩn 3-layer rule.md
/// </summary>
public class CloudinaryImageStorage : IImageStorage
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryImageStorage(string cloudName, string apiKey, string apiSecret)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(cloudName);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiSecret);

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account)
        {
            Api = { Secure = true }
        };
    }

    public async Task<UploadedImage> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, content),
            Folder = "smart-marketplace/tasks",
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams, ct);
        if (uploadResult.Error != null)
        {
            throw new InvalidOperationException($"Cloudinary upload failed: {uploadResult.Error.Message}");
        }

        var publicUrl = uploadResult.SecureUrl?.ToString() ?? uploadResult.Url?.ToString()
            ?? throw new InvalidOperationException("Không thể lấy URL ảnh sau khi upload lên Cloudinary.");

        return new UploadedImage(publicUrl);
    }

    public async Task DestroyAsync(string url, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(url)) return;

        try
        {
            var uri = new Uri(url);
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var uploadIdx = Array.IndexOf(segments, "upload");

            if (uploadIdx >= 0 && uploadIdx < segments.Length - 1)
            {
                var rest = segments.Skip(uploadIdx + 1).ToList();
                if (rest.Count > 0 && rest[0].StartsWith('v') && long.TryParse(rest[0][1..], out _))
                {
                    rest.RemoveAt(0);
                }

                var publicIdWithExt = string.Join("/", rest);
                var publicId = Path.ChangeExtension(publicIdWithExt, null);

                if (!string.IsNullOrWhiteSpace(publicId))
                {
                    var deleteParams = new DeletionParams(publicId);
                    await _cloudinary.DestroyAsync(deleteParams);
                }
            }
        }
        catch
        {
            // Không làm ngắt quãng transaction rollback nếu xoá ảnh trên Cloudinary lỗi
        }
    }
}
