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

    // ════════════════════════════════════════════════════════════════════════
    // Lọc & Chấm điểm Tasker cho một Task (FilterAndScoreWorkersAsync)
    //
    // STEP 1: HARD FILTER (Lọc cứng trong MySQL + kiểm tra trùng lịch)
    //   ✔ WorkerProfile.Status == "ONLINE"
    //   ✔ Sở hữu kỹ năng requiredSkillId của Task (bảng worker_skills)
    //   ✔ Có đăng ký hoạt động tại Tỉnh/Thành + Quận/Huyện của Task (bảng worker_districts)
    //   ✔ Không có Task nào đang MATCHED / IN_PROGRESS trùng khung giờ
    //
    // STEP 2: SCORING (Bỏ distanceScore vì khu vực đã lọc cứng qua worker_districts)
    //   ✔ ratingScore     = Clamp(rating, 0, 5) / 5.0          (Trọng số 60%)
    //   ✔ experienceScore = Min(completedTasks / 50.0, 1.0)    (Trọng số 40%)
    //   ✔ matchingScore   = ratingScore * 0.60 + experienceScore * 0.40
    //
    // STEP 3: RANKING — Sắp xếp theo matchingScore giảm dần
    // ════════════════════════════════════════════════════════════════════════
    public async Task<FilterTaskersResponse> FilterAndScoreWorkersAsync(string taskId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(taskId))
        {
            throw new BusinessValidationException("taskId là bắt buộc.");
        }

        var task = await tasks.FindTaskWithDetailsByIdAsync(taskId.Trim(), ct)
            ?? throw new NotFoundException("Không tìm thấy task.");

        if (task.Status != TaskItemStatus.PENDING)
        {
            throw new BusinessValidationException(
                $"Task đang ở trạng thái \"{task.Status}\", chỉ matching được task PENDING.");
        }

        var newStart = task.ScheduledStartTime;
        var newEnd = newStart.AddMinutes(task.ExpectedTime);

        // 1. Hard filter từ DB (ONLINE + có Skill + có đăng ký Quận/Huyện trong worker_districts)
        var candidates = await tasks.GetCandidateWorkersAsync(
            task.RequiredSkillId,
            task.City,
            task.District,
            ct);

        // 2. Loại bỏ các worker bị trùng lịch (otherStart < newEnd && otherEnd > newStart)
        var availableCandidates = candidates
            .Where(worker => !worker.TasksAccepted.Any(existing =>
            {
                var otherStart = existing.ScheduledStartTime;
                var otherEnd = otherStart.AddMinutes(existing.ExpectedTime);
                return otherStart < newEnd && otherEnd > newStart;
            }))
            .ToList();

        // 3. Tính điểm: Rating (60%) + Kinh nghiệm CompletedTasks (40%)
        var scored = availableCandidates
            .Select(worker =>
            {
                var ratingScore = CalculateRatingScore(worker.Rating);
                var experienceScore = CalculateExperienceScore(worker.CompletedTasks);
                var matchingScore = ratingScore * 0.60 + experienceScore * 0.40;

                return new FilterTaskersResponse.ScoredCandidateDto
                {
                    Candidate = new FilterTaskersResponse.CandidateInfoDto
                    {
                        Id = worker.Id,
                        UserId = worker.UserId,
                        Name = worker.User.Name,
                        Email = worker.User.Email,
                        PhoneNumber = worker.User.PhoneNumber,
                        Description = worker.Description,
                        Status = worker.Status,
                        Rating = worker.Rating,
                        CompletedTasks = worker.CompletedTasks,
                        Skills = worker.Skills
                            .Where(ws => ws.Skill is not null)
                            .Select(ws => new FilterTaskersResponse.SkillBriefDto
                            {
                                Id = ws.SkillId,
                                Name = ws.Skill.Name,
                            })
                            .ToList(),
                        ServiceDistricts = worker.ServiceDistricts
                            .Select(wd => new UserResponse.WorkerDistrictDto
                            {
                                Id = wd.Id,
                                ProvinceCode = wd.ProvinceCode,
                                ProvinceName = wd.ProvinceName,
                                DistrictCode = wd.DistrictCode,
                                DistrictName = wd.DistrictName,
                            })
                            .ToList(),
                    },
                    ScoreBreakdown = new FilterTaskersResponse.ScoreBreakdownDto
                    {
                        RatingScore = Math.Round(ratingScore, 4),
                        ExperienceScore = Math.Round(experienceScore, 4),
                    },
                    MatchingScore = Math.Round(matchingScore, 4),
                };
            })
            .OrderByDescending(x => x.MatchingScore)
            .ThenByDescending(x => x.Candidate.Rating)
            .ThenByDescending(x => x.Candidate.CompletedTasks)
            .ToList();

        return new FilterTaskersResponse
        {
            Task = new FilterTaskersResponse.TaskBriefDto
            {
                Id = task.Id,
                Title = task.Title,
                City = task.City,
                District = task.District,
                Status = task.Status.ToString(),
                RequiredSkill = new FilterTaskersResponse.SkillBriefDto
                {
                    Id = task.RequiredSkill.Id,
                    Name = task.RequiredSkill.Name,
                },
                Client = new FilterTaskersResponse.ClientBriefDto
                {
                    Id = task.Client.Id,
                    Name = task.Client.Name,
                },
            },
            TotalCandidates = scored.Count,
            Results = scored,
        };
    }

    private static double CalculateRatingScore(decimal rating)
    {
        var r = (double)rating;
        return Math.Clamp(r, 0.0, 5.0) / 5.0;
    }

    private static double CalculateExperienceScore(int completedTasks)
    {
        if (completedTasks <= 0) return 0.0;
        return Math.Min(completedTasks / 50.0, 1.0);
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
