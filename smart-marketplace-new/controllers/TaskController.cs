using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using smart_marketplace_new.auth;
using smart_marketplace_new.dto;
using smart_marketplace_new.services;

namespace smart_marketplace_new.controllers;

[ApiController]
[Route("api/tasks")]
public class TaskController(ITaskService tasks) : ControllerBase
{
    // Gợi ý danh sách công việc khi gõ từ khóa — Public không cần đăng nhập
    [HttpGet("suggestions")]
    [AllowAnonymous]
    public async Task<ActionResult<List<TaskSuggestionResponse>>> GetSuggestions(
        [FromQuery] string? q, [FromQuery] int limit = 6, CancellationToken ct = default)
    {
        var result = await tasks.GetSuggestionsAsync(q, Math.Clamp(limit, 1, 20), ct);
        return Ok(result);
    }

    // multipart/form-data: các trường task + images[] (0-10 file)
    [HttpPost]
    [AuthorizeRoles("CLIENT")]
    [RequestSizeLimit(60 * 1024 * 1024)] // 10 ảnh x 5MB + phần dư
    public async Task<ActionResult<CreateTaskResponse>> Create(
        [FromForm] CreateTaskRequest request, CancellationToken ct)
    {
        // clientId từ JWT claim "id" — không nhận từ body
        var clientId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        var result = await tasks.CreateAsync(clientId, request, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    // Lọc & chấm điểm Tasker theo taskId (Hard filter: ONLINE + Skill + worker_districts + không trùng lịch;
    // Score: Rating 60% + CompletedTasks 40%)
    // Chỉ CLIENT đăng task mới được xem danh sách ứng viên — response không chứa PII (email/SDT)
    [HttpPost("filter")]
    [AuthorizeRoles("CLIENT")]
    public async Task<ActionResult<FilterTaskersResponse>> FilterTaskers(
        [FromBody] FilterTaskersRequest request, CancellationToken ct = default)
    {
        var result = await tasks.FilterAndScoreWorkersAsync(request.TaskId, ct);
        return Ok(result);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TASKER: Quản lý Yêu cầu & Lịch hẹn
    // ════════════════════════════════════════════════════════════════════════

    // Lấy danh sách yêu cầu & lịch hẹn cho Tasker kèm số liệu thống kê (Bento Cards)
    [HttpGet("tasker")]
    [AuthorizeRoles("TASKER", "WORKER")]
    public async Task<ActionResult<TaskerTaskListResponse>> GetTaskerTasks(
        [FromQuery] string? status, CancellationToken ct = default)
    {
        var workerUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        var result = await tasks.GetTaskerTasksAsync(workerUserId, status, ct);
        return Ok(result);
    }

    // Nhận việc: PENDING -> MATCHED
    [HttpPost("{taskId}/accept")]
    [AuthorizeRoles("TASKER", "WORKER")]
    public async Task<ActionResult> AcceptTask(
        [FromRoute] string taskId, CancellationToken ct = default)
    {
        var workerUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        await tasks.AcceptTaskAsync(workerUserId, taskId, ct);
        return Ok(new { message = "Đã nhận việc thành công." });
    }

    // Từ chối việc: PENDING/MATCHED -> Hoàn cọc Escrow cho khách & quay về PENDING chưa gán thợ
    [HttpPost("{taskId}/decline")]
    [AuthorizeRoles("TASKER", "WORKER")]
    public async Task<ActionResult> DeclineTask(
        [FromRoute] string taskId, CancellationToken ct = default)
    {
        var workerUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        await tasks.DeclineTaskAsync(workerUserId, taskId, ct);
        return Ok(new { message = "Đã từ chối công việc." });
    }

    // Bắt đầu di chuyển / làm việc: MATCHED -> IN_PROGRESS
    [HttpPost("{taskId}/start")]
    [AuthorizeRoles("TASKER", "WORKER")]
    public async Task<ActionResult> StartTask(
        [FromRoute] string taskId, CancellationToken ct = default)
    {
        var workerUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        await tasks.StartTaskAsync(workerUserId, taskId, ct);
        return Ok(new { message = "Đã bắt đầu công việc." });
    }

    // Báo kết thúc công việc: IN_PROGRESS -> AWAITING_APPROVAL (chờ khách duyệt & nghiệm thu)
    [HttpPost("{taskId}/complete")]
    [AuthorizeRoles("TASKER", "WORKER")]
    public async Task<ActionResult> CompleteTask(
        [FromRoute] string taskId, CancellationToken ct = default)
    {
        var workerUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        await tasks.CompleteTaskAsync(workerUserId, taskId, ct);
        return Ok(new { message = "Đã báo hoàn thành công việc, đang chờ khách hàng duyệt và giải ngân." });
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLIENT: Gán thợ trực tiếp (Direct Offer) & Nghiệm thu giải ngân
    // ════════════════════════════════════════════════════════════════════════

    [HttpPost("{taskId}/assign/{workerProfileId}")]
    [AuthorizeRoles("CLIENT")]
    public async Task<ActionResult> AssignWorker(
        [FromRoute] string taskId, [FromRoute] string workerProfileId, CancellationToken ct = default)
    {
        var clientUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        await tasks.AssignWorkerAsync(clientUserId, taskId, workerProfileId, ct);
        return Ok(new { message = "Đã gửi đề xuất công việc cho thợ và cọc tiền thành công." });
    }

    // Khách hàng nghiệm thu & giải ngân: AWAITING_APPROVAL -> DONE
    [HttpPost("{taskId}/approve")]
    [AuthorizeRoles("CLIENT")]
    public async Task<ActionResult> ApproveTask(
        [FromRoute] string taskId, CancellationToken ct = default)
    {
        var clientUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        await tasks.ApproveTaskAsync(clientUserId, taskId, ct);
        return Ok(new { message = "Đã xác nhận nghiệm thu và giải ngân tiền công cho thợ thành công." });
    }

    // Lấy danh sách công việc của Client (kèm số liệu thống kê)
    [HttpGet("client")]
    [AuthorizeRoles("CLIENT")]
    public async Task<ActionResult<ClientTaskListResponse>> GetClientTasks(
        [FromQuery] string? status, CancellationToken ct = default)
    {
        var clientUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        var result = await tasks.GetClientTasksAsync(clientUserId, status, ct);
        return Ok(result);
    }

    // Khách hàng hủy công việc: PENDING/MATCHED -> CANCELLED (hoàn cọc Escrow nếu đã gán thợ)
    [HttpPost("{taskId}/cancel")]
    [AuthorizeRoles("CLIENT")]
    public async Task<ActionResult> CancelTask(
        [FromRoute] string taskId, CancellationToken ct = default)
    {
        var clientUserId = User.FindFirst("id")?.Value
            ?? throw new InvalidCredentialsException("Token không hợp lệ.");

        await tasks.CancelTaskByClientAsync(clientUserId, taskId, ct);
        return Ok(new { message = "Đã hủy công việc thành công." });
    }
}
