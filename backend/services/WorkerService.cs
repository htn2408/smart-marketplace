using Microsoft.AspNetCore.Http;
using smart_marketplace_new.dto;
using smart_marketplace_new.models;
using smart_marketplace_new.repositories;

namespace smart_marketplace_new.services;

public interface IWorkerService
{
    Task<WorkerPublicProfileResponse> GetPublicProfileAsync(string userId, CancellationToken ct = default);
    Task<List<WorkerImageResponse>> GetGalleryImagesAsync(string userId, CancellationToken ct = default);
    Task<WorkerImageResponse> AddGalleryImageAsync(string userId, CreateWorkerImageRequest request, CancellationToken ct = default);
    Task DeleteGalleryImageAsync(string userId, string imageId, CancellationToken ct = default);
}

// Hồ sơ public của Tasker cho client xem (GET /api/workers/{userId})
// & Quản lý thư viện hình ảnh công trình thực tế (worker_images) theo chuẩn rule.md
public class WorkerService(
    IUserRepository users,
    IWorkerImageRepository workerImages,
    IImageStorage imageStorage) : IWorkerService
{
    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB

    public async Task<WorkerPublicProfileResponse> GetPublicProfileAsync(string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new BusinessValidationException("userId là bắt buộc.");
        }

        var wp = await users.FindWorkerProfileByUserIdAsync(userId.Trim(), ct)
            ?? throw new NotFoundException("Không tìm thấy Tasker.");

        return new WorkerPublicProfileResponse
        {
            Id = wp.Id,
            WorkerProfileId = wp.Id,
            UserId = wp.UserId,
            Name = wp.User.Name,
            Description = wp.Description,
            Status = wp.Status,
            Rating = wp.Rating,
            CompletedTasks = wp.CompletedTasks,
            MemberSince = wp.User.CreatedAt,
            Skills = wp.Skills
                .Where(ws => ws.Skill is not null)
                .Select(ws => new WorkerPublicProfileResponse.SkillDto
                {
                    Id = ws.SkillId,
                    Name = ws.Skill.Name,
                })
                .ToList(),
            ServiceDistricts = wp.ServiceDistricts
                .Select(wd => new WorkerPublicProfileResponse.DistrictDto
                {
                    ProvinceCode = wd.ProvinceCode,
                    ProvinceName = wd.ProvinceName,
                    DistrictCode = wd.DistrictCode,
                    DistrictName = wd.DistrictName,
                })
                .ToList(),
            GalleryImages = wp.GalleryImages
                .OrderByDescending(gi => gi.CreatedAt)
                .Select(gi => new WorkerImageResponse
                {
                    Id = gi.Id,
                    ImageUrl = gi.ImageUrl,
                    Title = gi.Title,
                    Tag = gi.Tag,
                    Location = gi.Location,
                    CreatedAt = gi.CreatedAt,
                })
                .ToList(),
        };
    }

    public async Task<List<WorkerImageResponse>> GetGalleryImagesAsync(string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new BusinessValidationException("userId là bắt buộc.");
        }

        var wp = await users.FindWorkerProfileByUserIdAsync(userId.Trim(), ct)
            ?? throw new NotFoundException("Không tìm thấy Tasker.");

        var images = await workerImages.GetByWorkerProfileIdAsync(wp.Id, ct);
        return images.Select(gi => new WorkerImageResponse
        {
            Id = gi.Id,
            ImageUrl = gi.ImageUrl,
            Title = gi.Title,
            Tag = gi.Tag,
            Location = gi.Location,
            CreatedAt = gi.CreatedAt,
        }).ToList();
    }

    public async Task<WorkerImageResponse> AddGalleryImageAsync(string userId, CreateWorkerImageRequest request, CancellationToken ct = default)
    {
        var wp = await users.FindWorkerProfileByUserIdAsync(userId, ct)
            ?? throw new NotFoundException("Hồ sơ Thợ không tồn tại.");

        string finalUrl;
        if (request.File is not null && request.File.Length > 0)
        {
            if (request.File.Length > MaxImageBytes)
            {
                throw new BusinessValidationException($"Ảnh \"{request.File.FileName}\" vượt quá giới hạn 5 MB.");
            }
            if (!request.File.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessValidationException("Chỉ chấp nhận định dạng file hình ảnh (image/*).");
            }

            await using var stream = request.File.OpenReadStream();
            var uploadResult = await imageStorage.UploadAsync(stream, request.File.FileName, request.File.ContentType, ct);
            finalUrl = uploadResult.Url;
        }
        else if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            finalUrl = request.ImageUrl.Trim();
        }
        else
        {
            throw new BusinessValidationException("Vui lòng đính kèm file ảnh hoặc cung cấp URL hình ảnh công trình.");
        }

        var image = new WorkerImage
        {
            Id = Guid.NewGuid().ToString(),
            WorkerProfileId = wp.Id,
            ImageUrl = finalUrl,
            Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim(),
            Tag = string.IsNullOrWhiteSpace(request.Tag) ? null : request.Tag.Trim(),
            Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        await workerImages.AddAsync(image, ct);
        await workerImages.SaveAsync(ct);

        return new WorkerImageResponse
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl,
            Title = image.Title,
            Tag = image.Tag,
            Location = image.Location,
            CreatedAt = image.CreatedAt,
        };
    }

    public async Task DeleteGalleryImageAsync(string userId, string imageId, CancellationToken ct = default)
    {
        var wp = await users.FindWorkerProfileByUserIdAsync(userId, ct)
            ?? throw new NotFoundException("Hồ sơ Thợ không tồn tại.");

        var image = await workerImages.FindByIdAsync(imageId, ct)
            ?? throw new NotFoundException("Không tìm thấy hình ảnh công trình.");

        if (image.WorkerProfileId != wp.Id)
        {
            throw new ForbiddenException("Bạn không có quyền xoá hình ảnh này.");
        }

        workerImages.Remove(image);
        await workerImages.SaveAsync(ct);

        // Best-effort cleanup ảnh trên Cloudinary
        try
        {
            await imageStorage.DestroyAsync(image.ImageUrl, ct);
        }
        catch
        {
            // Bỏ qua lỗi xóa trên Cloudinary nếu ảnh không tồn tại
        }
    }
}
