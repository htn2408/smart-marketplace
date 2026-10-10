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
}
