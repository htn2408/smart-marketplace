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
                ProvinceCode = request.ProvinceCode,
                DistrictCode = request.DistrictCode,
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
    // STEP 1: HARD FILTER (Lọc cứng trong MySQL — 1 câu query duy nhất)
    //   ✔ WorkerProfile.Status == "ONLINE"
    //   ✔ Sở hữu kỹ năng requiredSkillId của Task (bảng worker_skills)
    //   ✔ Có đăng ký hoạt động tại khu vực của Task (bảng worker_districts —
    //     ưu tiên so ProvinceCode/DistrictCode, task cũ thiếu code thì so tên)
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

        // Hard filter hoàn toàn trong SQL (ONLINE + Skill + khu vực + không trùng lịch)
        var candidates = await tasks.GetCandidateWorkersAsync(
            task.RequiredSkillId,
            task.City,
            task.District,
            task.ProvinceCode,
            task.DistrictCode,
            newStart,
            newEnd,
            ct);

        // Tính điểm: Rating (60%) + Kinh nghiệm CompletedTasks (40%)
        var scored = candidates
            .Select(worker =>
            {
                var ratingScore = MatchingScorer.CalculateRatingScore(worker.Rating);
                var experienceScore = MatchingScorer.CalculateExperienceScore(worker.CompletedTasks);
                var matchingScore = MatchingScorer.CalculateMatchingScore(ratingScore, experienceScore);

                return new FilterTaskersResponse.ScoredCandidateDto
                {
                    Candidate = new FilterTaskersResponse.CandidateInfoDto
                    {
                        Id = worker.Id,
                        UserId = worker.UserId,
                        Name = worker.User.Name,
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

    // ════════════════════════════════════════════════════════════════════════
    // TASKER: Quản lý Yêu cầu & Lịch hẹn
    // ════════════════════════════════════════════════════════════════════════

    public async Task<TaskerTaskListResponse> GetTaskerTasksAsync(string workerUserId, string? statusFilter, CancellationToken ct = default)
    {
        var workerProfile = await tasks.FindWorkerProfileByUserIdTrackingAsync(workerUserId, ct)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ thợ.");

        var allTasks = await tasks.GetTasksByWorkerProfileIdAsync(workerProfile.Id, ct);

        var stats = new TaskerTaskListResponse.TaskerStatsDto
        {
            PendingCount = allTasks.Count(t => t.Status == TaskItemStatus.PENDING),
            MatchedCount = allTasks.Count(t => t.Status == TaskItemStatus.MATCHED),
            InProgressCount = allTasks.Count(t => t.Status == TaskItemStatus.IN_PROGRESS),
            AwaitingApprovalCount = allTasks.Count(t => t.Status == TaskItemStatus.AWAITING_APPROVAL),
            DoneCount = allTasks.Count(t => t.Status == TaskItemStatus.DONE),
            CancelledCount = allTasks.Count(t => t.Status == TaskItemStatus.CANCELLED),
        };

        var filteredTasks = allTasks;
        if (!string.IsNullOrWhiteSpace(statusFilter) && !statusFilter.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<TaskItemStatus>(statusFilter.Trim(), true, out var parsedStatus))
            {
                filteredTasks = allTasks.Where(t => t.Status == parsedStatus).ToList();
            }
            else
            {
                var normalized = statusFilter.Trim().ToUpperInvariant();
                filteredTasks = normalized switch
                {
                    "NEW" => allTasks.Where(t => t.Status == TaskItemStatus.PENDING).ToList(),
                    "CONFIRMED" => allTasks.Where(t => t.Status == TaskItemStatus.MATCHED).ToList(),
                    "AWAITING_APPROVAL" => allTasks.Where(t => t.Status == TaskItemStatus.AWAITING_APPROVAL).ToList(),
                    "COMPLETED" => allTasks.Where(t => t.Status == TaskItemStatus.DONE).ToList(),
                    _ => allTasks
                };
            }
        }

        var taskDtos = filteredTasks.Select(t => new TaskerTaskListResponse.TaskerTaskDto
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            Category = t.RequiredSkill?.Category?.Name ?? "Dịch vụ đời sống",
            SkillName = t.RequiredSkill?.Name ?? "Chuyên môn",
            Status = t.Status.ToString(),
            Client = new TaskerTaskListResponse.ClientBriefDto
            {
                Id = t.ClientId,
                Name = t.Client.Name,
                PhoneNumber = t.Status >= TaskItemStatus.MATCHED ? t.Client.PhoneNumber : null,
            },
            City = t.City,
            District = t.District,
            Address = t.Address,
            Latitude = t.Latitude,
            Longitude = t.Longitude,
            ScheduledStartTime = t.ScheduledStartTime,
            ExpectedTime = t.ExpectedTime,
            ActualStartTime = t.ActualStartTime,
            ActualEndTime = t.ActualEndTime,
            OfferedPrice = t.OfferedPrice,
            Images = t.Images.Select(i => i.ImageUrl).ToList(),
            CreatedAt = t.CreatedAt,
        }).ToList();

        return new TaskerTaskListResponse
        {
            Stats = stats,
            Tasks = taskDtos,
        };
    }

    public async Task AcceptTaskAsync(string workerUserId, string taskId, CancellationToken ct = default)
    {
        var workerProfile = await tasks.FindWorkerProfileByUserIdTrackingAsync(workerUserId, ct)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ thợ.");

        var task = await tasks.FindTaskByIdTrackingAsync(taskId, ct)
            ?? throw new NotFoundException("Không tìm thấy công việc.");

        if (task.WorkerProfileId != workerProfile.Id)
        {
            throw new BusinessValidationException("Công việc này không được giao cho bạn.");
        }

        if (task.Status != TaskItemStatus.PENDING)
        {
            throw new BusinessValidationException($"Công việc đang ở trạng thái \"{task.Status}\", chỉ có thể nhận khi ở trạng thái chờ (PENDING).");
        }

        var taskEnd = task.ScheduledStartTime.AddMinutes(task.ExpectedTime);
        var isOverlapping = await tasks.HasOverlappingTaskAsync(workerProfile.Id, task.ScheduledStartTime, taskEnd, task.Id, ct);
        if (isOverlapping)
        {
            throw new BusinessValidationException("Bạn đã có lịch làm việc trùng với khung giờ này.");
        }

        task.Status = TaskItemStatus.MATCHED;
        task.UpdatedAt = DateTime.UtcNow;

        await tasks.SaveAsync(ct);
    }

    public async Task DeclineTaskAsync(string workerUserId, string taskId, CancellationToken ct = default)
    {
        var workerProfile = await tasks.FindWorkerProfileByUserIdTrackingAsync(workerUserId, ct)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ thợ.");

        var task = await tasks.FindTaskByIdTrackingAsync(taskId, ct)
            ?? throw new NotFoundException("Không tìm thấy công việc.");

        if (task.WorkerProfileId != workerProfile.Id)
        {
            throw new BusinessValidationException("Bạn không có quyền thao tác trên công việc này.");
        }

        if (task.Status != TaskItemStatus.PENDING && task.Status != TaskItemStatus.MATCHED)
        {
            throw new BusinessValidationException($"Không thể từ chối công việc đang ở trạng thái \"{task.Status}\".");
        }

        // Hoàn cọc Escrow cho khách hàng
        task.Client.HeldBalance = Math.Max(0m, task.Client.HeldBalance - task.OfferedPrice);
        task.Client.Balance += task.OfferedPrice;

        // Trả task về PENDING chưa gán thợ
        task.WorkerProfileId = null;
        task.Status = TaskItemStatus.PENDING;
        task.UpdatedAt = DateTime.UtcNow;

        await tasks.SaveAsync(ct);
    }

    public async Task StartTaskAsync(string workerUserId, string taskId, CancellationToken ct = default)
    {
        var workerProfile = await tasks.FindWorkerProfileByUserIdTrackingAsync(workerUserId, ct)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ thợ.");

        var task = await tasks.FindTaskByIdTrackingAsync(taskId, ct)
            ?? throw new NotFoundException("Không tìm thấy công việc.");

        if (task.WorkerProfileId != workerProfile.Id)
        {
            throw new BusinessValidationException("Bạn không có quyền thao tác trên công việc này.");
        }

        if (task.Status != TaskItemStatus.MATCHED)
        {
            throw new BusinessValidationException($"Chỉ có thể bắt đầu khi công việc đã xác nhận (MATCHED). Trạng thái hiện tại: {task.Status}.");
        }

        task.Status = TaskItemStatus.IN_PROGRESS;
        task.ActualStartTime = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;

        await tasks.SaveAsync(ct);
    }

    public async Task CompleteTaskAsync(string workerUserId, string taskId, CancellationToken ct = default)
    {
        var workerProfile = await tasks.FindWorkerProfileByUserIdTrackingAsync(workerUserId, ct)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ thợ.");

        var task = await tasks.FindTaskByIdTrackingAsync(taskId, ct)
            ?? throw new NotFoundException("Không tìm thấy công việc.");

        if (task.WorkerProfileId != workerProfile.Id)
        {
            throw new BusinessValidationException("Bạn không có quyền thao tác trên công việc này.");
        }

        if (task.Status != TaskItemStatus.IN_PROGRESS)
        {
            throw new BusinessValidationException($"Chỉ có thể hoàn thành khi công việc đang thực hiện (IN_PROGRESS). Trạng thái hiện tại: {task.Status}.");
        }

        var now = DateTime.UtcNow;
        task.Status = TaskItemStatus.AWAITING_APPROVAL;
        task.ActualEndTime = now;
        task.UpdatedAt = now;

        // Tạo hoặc cập nhật hóa đơn ở trạng thái PENDING (chờ khách duyệt)
        if (task.Invoice is null)
        {
            task.Invoice = new Invoice
            {
                TaskId = task.Id,
                TotalAmount = task.OfferedPrice,
                Status = InvoiceStatus.PENDING,
                CreatedAt = now,
                UpdatedAt = now,
            };
        }
        else
        {
            task.Invoice.TotalAmount = task.OfferedPrice;
            task.Invoice.Status = InvoiceStatus.PENDING;
            task.Invoice.UpdatedAt = now;
        }

        await tasks.SaveAsync(ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLIENT: Chọn thợ (Direct Offer & Escrow) & Nghiệm thu
    // ════════════════════════════════════════════════════════════════════════

    public async Task AssignWorkerAsync(string clientUserId, string taskId, string workerProfileId, CancellationToken ct = default)
    {
        var task = await tasks.FindTaskByIdTrackingAsync(taskId, ct)
            ?? throw new NotFoundException("Không tìm thấy công việc.");

        if (task.ClientId != clientUserId)
        {
            throw new BusinessValidationException("Bạn không phải chủ sở hữu công việc này.");
        }

        if (task.Status != TaskItemStatus.PENDING)
        {
            throw new BusinessValidationException($"Công việc đang ở trạng thái \"{task.Status}\", không thể gán thợ.");
        }

        if (!string.IsNullOrEmpty(task.WorkerProfileId))
        {
            throw new BusinessValidationException("Công việc này đã được gán cho một thợ khác.");
        }

        var worker = await tasks.FindWorkerProfileByIdAsync(workerProfileId, ct)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ thợ.");

        if (worker.Status != "ONLINE")
        {
            throw new BusinessValidationException("Thợ hiện đang không trực tuyến (OFFLINE).");
        }

        if (task.Client.Balance < task.OfferedPrice)
        {
            throw new BusinessValidationException($"Số dư trong ví ({task.Client.Balance:N0} đ) không đủ để cọc ({task.OfferedPrice:N0} đ). Vui lòng nạp thêm tiền.");
        }

        // Đặt cọc Escrow
        task.Client.Balance -= task.OfferedPrice;
        task.Client.HeldBalance += task.OfferedPrice;

        task.WorkerProfileId = worker.Id;
        task.UpdatedAt = DateTime.UtcNow;

        await tasks.SaveAsync(ct);
    }

    public async Task ApproveTaskAsync(string clientUserId, string taskId, CancellationToken ct = default)
    {
        var task = await tasks.FindTaskByIdTrackingAsync(taskId, ct)
            ?? throw new NotFoundException("Không tìm thấy công việc.");

        if (task.ClientId != clientUserId)
        {
            throw new BusinessValidationException("Bạn không phải chủ sở hữu công việc này.");
        }

        if (task.Status != TaskItemStatus.AWAITING_APPROVAL)
        {
            throw new BusinessValidationException($"Chỉ có thể xác nhận khi thợ đã báo hoàn tất công việc (AWAITING_APPROVAL). Trạng thái hiện tại: {task.Status}.");
        }

        if (task.WorkerProfile is null)
        {
            throw new BusinessValidationException("Công việc chưa có thông tin thợ nhận việc.");
        }

        var now = DateTime.UtcNow;
        task.Status = TaskItemStatus.DONE;
        task.UpdatedAt = now;

        // Giải ngân cọc Escrow: giảm HeldBalance của khách, cộng Balance cho thợ
        task.Client.HeldBalance = Math.Max(0m, task.Client.HeldBalance - task.OfferedPrice);
        task.WorkerProfile.User.Balance += task.OfferedPrice;
        task.WorkerProfile.CompletedTasks += 1;

        // Hóa đơn chuyển sang PAID
        if (task.Invoice is null)
        {
            task.Invoice = new Invoice
            {
                TaskId = task.Id,
                TotalAmount = task.OfferedPrice,
                Status = InvoiceStatus.PAID,
                CreatedAt = now,
                UpdatedAt = now,
                PaidAt = now,
            };
        }
        else
        {
            task.Invoice.Status = InvoiceStatus.PAID;
            task.Invoice.PaidAt = now;
            task.Invoice.UpdatedAt = now;
        }

        await tasks.SaveAsync(ct);
    }

    public async Task<ClientTaskListResponse> GetClientTasksAsync(string clientUserId, string? statusFilter, CancellationToken ct = default)
    {
        var allTasks = await tasks.GetTasksByClientIdAsync(clientUserId, ct);

        var stats = new ClientTaskListResponse.ClientStatsDto
        {
            PendingCount = allTasks.Count(t => t.Status == TaskItemStatus.PENDING),
            MatchedCount = allTasks.Count(t => t.Status == TaskItemStatus.MATCHED),
            InProgressCount = allTasks.Count(t => t.Status == TaskItemStatus.IN_PROGRESS),
            AwaitingApprovalCount = allTasks.Count(t => t.Status == TaskItemStatus.AWAITING_APPROVAL),
            DoneCount = allTasks.Count(t => t.Status == TaskItemStatus.DONE),
            CancelledCount = allTasks.Count(t => t.Status == TaskItemStatus.CANCELLED),
        };

        var filteredTasks = allTasks;
        if (!string.IsNullOrWhiteSpace(statusFilter) && !statusFilter.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<TaskItemStatus>(statusFilter.Trim(), true, out var parsedStatus))
            {
                filteredTasks = allTasks.Where(t => t.Status == parsedStatus).ToList();
            }
            else
            {
                var normalized = statusFilter.Trim().ToUpperInvariant();
                filteredTasks = normalized switch
                {
                    "NEW" => allTasks.Where(t => t.Status == TaskItemStatus.PENDING).ToList(),
                    "PENDING" => allTasks.Where(t => t.Status == TaskItemStatus.PENDING).ToList(),
                    "ACCEPTED" or "MATCHED" or "CONFIRMED" => allTasks.Where(t => t.Status == TaskItemStatus.MATCHED).ToList(),
                    "IN_PROGRESS" => allTasks.Where(t => t.Status == TaskItemStatus.IN_PROGRESS).ToList(),
                    "AWAITING_APPROVAL" => allTasks.Where(t => t.Status == TaskItemStatus.AWAITING_APPROVAL).ToList(),
                    "COMPLETED" or "DONE" => allTasks.Where(t => t.Status == TaskItemStatus.DONE).ToList(),
                    "CANCELLED" => allTasks.Where(t => t.Status == TaskItemStatus.CANCELLED).ToList(),
                    _ => allTasks
                };
            }
        }

        var taskDtos = filteredTasks.Select(t => new ClientTaskListResponse.ClientTaskDto
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            Category = t.RequiredSkill?.Category?.Name ?? "Dịch vụ đời sống",
            SkillName = t.RequiredSkill?.Name ?? "Chuyên môn",
            Status = t.Status.ToString(),
            Worker = t.WorkerProfile != null ? new ClientTaskListResponse.WorkerBriefDto
            {
                Id = t.WorkerProfile.Id,
                UserId = t.WorkerProfile.UserId,
                Name = t.WorkerProfile.User?.Name ?? "Thợ chuyên nghiệp",
                PhoneNumber = t.Status >= TaskItemStatus.MATCHED ? t.WorkerProfile.User?.PhoneNumber : null,
                Rating = t.WorkerProfile.Rating,
                CompletedTasks = t.WorkerProfile.CompletedTasks,
            } : null,
            City = t.City,
            District = t.District,
            Address = t.Address,
            Latitude = t.Latitude,
            Longitude = t.Longitude,
            ScheduledStartTime = t.ScheduledStartTime,
            ExpectedTime = t.ExpectedTime,
            ActualStartTime = t.ActualStartTime,
            ActualEndTime = t.ActualEndTime,
            OfferedPrice = t.OfferedPrice,
            Images = t.Images.Select(i => i.ImageUrl).ToList(),
            CreatedAt = t.CreatedAt,
        }).ToList();

        return new ClientTaskListResponse
        {
            Stats = stats,
            Tasks = taskDtos,
        };
    }

    public async Task CancelTaskByClientAsync(string clientUserId, string taskId, CancellationToken ct = default)
    {
        var task = await tasks.FindTaskByIdTrackingAsync(taskId, ct)
            ?? throw new NotFoundException("Không tìm thấy công việc.");

        if (task.ClientId != clientUserId)
        {
            throw new BusinessValidationException("Bạn không phải chủ sở hữu công việc này.");
        }

        if (task.Status != TaskItemStatus.PENDING && task.Status != TaskItemStatus.MATCHED)
        {
            throw new BusinessValidationException($"Chỉ có thể hủy khi công việc đang chờ nhận hoặc đã xác nhận. Trạng thái hiện tại: {task.Status}.");
        }

        // Nếu đã gán thợ và đã cọc tiền -> hoàn cọc cho khách
        if (!string.IsNullOrEmpty(task.WorkerProfileId))
        {
            task.Client.HeldBalance = Math.Max(0m, task.Client.HeldBalance - task.OfferedPrice);
            task.Client.Balance += task.OfferedPrice;
        }

        task.Status = TaskItemStatus.CANCELLED;
        task.UpdatedAt = DateTime.UtcNow;

        await tasks.SaveAsync(ct);
    }
}
