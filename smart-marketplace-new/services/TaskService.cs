using smart_marketplace_new.dto;
using smart_marketplace_new.models;
using smart_marketplace_new.repositories;

namespace smart_marketplace_new.services;

// Business logic tạo task — port của task.controller.js theo schema HIỆN TẠI
// (expectedTime phút + offeredPrice trọn gói; bỏ estimatedHours/hourlyRate đã bị xóa).
// Các fix so với bản Node:
//   - clientId từ JWT claim (không nhận từ body)
//   - ScheduledStartTime phải ở tương lai (biên độ 1 phút cho lệch đồng hồ)
//   - upload ảnh TRƯỚC khi save, nhưng save thất bại thì destroy ảnh vừa upload
//     (bản Node để lại ảnh mồ côi trên Cloudinary)
public class TaskService(ITaskRepository tasks, IImageStorage imageStorage) : ITaskService
{
    private const int MaxImages = 10;
    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB

    public async Task<CreateTaskResponse> CreateAsync(string clientId, CreateTaskRequest request, CancellationToken ct = default)
    {
        // 1. Skill phải tồn tại (FK restrict — check trước để trả 404 rõ ràng)
        var skill = await tasks.FindSkillByIdAsync(request.RequiredSkillId, ct)
            ?? throw new NotFoundException("Không tìm thấy skill.");

        // 2. Thời gian bắt đầu phải ở tương lai (cho phép lệch 1 phút)
        if (request.ScheduledStartTime <= DateTime.UtcNow.AddMinutes(1))
        {
            throw new BusinessValidationException("Thời gian bắt đầu phải ở tương lai.");
        }

        // 3. Validate ảnh (giới hạn như multer cũ: 10 file, 5MB, image/*)
        ValidateImages(request.Images);

        // 4. Upload ảnh (song song)
        var uploadedUrls = new List<string>();
        try
        {
            foreach (var file in request.Images)
            {
                await using var stream = file.OpenReadStream();
                var uploaded = await imageStorage.UploadAsync(stream, file.FileName, file.ContentType, ct);
                uploadedUrls.Add(uploaded.Url);
            }

            // 5. Lưu Task + TaskImages — 1 lần SaveChanges = 1 transaction
            var task = new TaskItem
            {
                Title = request.Title.Trim(),
                Description = request.Description?.Trim(),
                City = request.City.Trim(),
                District = request.District.Trim(),
                Address = request.Address?.Trim(),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Status = TaskItemStatus.PENDING,
                ScheduledStartTime = request.ScheduledStartTime,
                ExpectedTime = request.ExpectedTime,
                OfferedPrice = request.OfferedPrice,
                ClientId = clientId,
                RequiredSkillId = skill.Id,
                Images = uploadedUrls.Select(url => new TaskImage { ImageUrl = url }).ToList(),
            };

            await tasks.AddAsync(task, ct);
            await tasks.SaveAsync(ct);

            // 6. Response
            return new CreateTaskResponse
            {
                Task = new CreateTaskResponse.TaskInfo
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    City = task.City,
                    District = task.District,
                    Address = task.Address,
                    Latitude = task.Latitude,
                    Longitude = task.Longitude,
                    Status = task.Status.ToString(),
                    ScheduledStartTime = task.ScheduledStartTime,
                    ExpectedTime = task.ExpectedTime,
                    OfferedPrice = task.OfferedPrice,
                    Images = task.Images.Select(i => new CreateTaskResponse.TaskInfo.ImageInfo { ImageUrl = i.ImageUrl }).ToList(),
                    RequiredSkill = new() { Id = skill.Id, Name = skill.Name },
                    Client = new() { Id = clientId },
                },
            };
        }
        catch
        {
            // Save/upload thất bại sau khi đã upload một phần → dọn ảnh đã lên
            foreach (var url in uploadedUrls)
            {
                try { await imageStorage.DestroyAsync(url, ct); } catch { /* cleanup best-effort */ }
            }
            throw;
        }
    }

    private static void ValidateImages(List<IFormFile> images)
    {
        if (images.Count > MaxImages)
        {
            throw new BusinessValidationException($"Tối đa {MaxImages} ảnh mỗi task.");
        }

        foreach (var file in images)
        {
            if (file.Length > MaxImageBytes)
            {
                throw new BusinessValidationException($"Ảnh \"{file.FileName}\" vượt quá 5 MB.");
            }
            if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessValidationException("Chỉ chấp nhận file ảnh (image/*).");
            }
        }
    }

    public async Task<List<TaskSuggestionResponse>> GetSuggestionsAsync(string? query, int limit, CancellationToken ct = default)
    {
        var skills = await tasks.GetSkillSuggestionsAsync(query, limit, ct);
        return skills.Select(s => new TaskSuggestionResponse
        {
            SkillId = s.Id,
            Title = s.Name,
            CategoryName = s.Category?.Name ?? "Dịch vụ đời sống",
            Icon = MapCategoryToIcon(s.Category?.Name),
            SuggestedPrice = 350000m,
            EstimatedMinutes = 120
        }).ToList();
    }

    private static string MapCategoryToIcon(string? categoryName)
    {
        if (string.IsNullOrEmpty(categoryName)) return "handyman";
        var cat = categoryName.ToLowerInvariant();
        if (cat.Contains("lắp") || cat.Contains("nội thất")) return "shelves";
        if (cat.Contains("dọn") || cat.Contains("vệ sinh")) return "cleaning_services";
        if (cat.Contains("điện") || cat.Contains("nước")) return "plumbing";
        if (cat.Contains("chuyển") || cat.Contains("vận chuyển")) return "local_shipping";
        if (cat.Contains("sơn") || cat.Contains("sửa")) return "build";
        return "handyman";
    }
}
