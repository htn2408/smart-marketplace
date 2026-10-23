using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using smart_marketplace_new.dto;
using smart_marketplace_new.services;

namespace smart_marketplace_new.controllers;

[ApiController]
[Route("api/workers")]
public class WorkersController(IWorkerService workers) : ControllerBase
{
    // Hồ sơ public của Tasker theo userId — client xem trước khi gửi offer.
    // Public vì không chứa PII (email/phone đã bị loại khỏi response).
    [HttpGet("{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<WorkerPublicProfileResponse>> GetPublicProfile(
        string userId, CancellationToken ct = default)
    {
        var result = await workers.GetPublicProfileAsync(userId, ct);
        return Ok(result);
    }

    // Danh sách hình ảnh công trình thực tế của thợ
    [HttpGet("{userId}/gallery")]
    [AllowAnonymous]
    public async Task<ActionResult<List<WorkerImageResponse>>> GetGallery(
        string userId, CancellationToken ct = default)
    {
        var result = await workers.GetGalleryImagesAsync(userId, ct);
        return Ok(result);
    }

    // Thợ đăng tải hình ảnh công trình thực tế lên hồ sơ của mình (hỗ trợ multipart upload hoặc URL)
    [HttpPost("gallery")]
    [Authorize]
    [Consumes("multipart/form-data", "application/json")]
    public async Task<ActionResult<WorkerImageResponse>> AddGalleryImage(
        [FromForm] CreateWorkerImageRequest request, CancellationToken ct = default)
    {
        var userId = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Token không hợp lệ." });
        }

        var result = await workers.AddGalleryImageAsync(userId, request, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    // Thợ xoá hình ảnh công trình khỏi hồ sơ của mình
    [HttpDelete("gallery/{imageId}")]
    [Authorize]
    public async Task<IActionResult> DeleteGalleryImage(
        string imageId, CancellationToken ct = default)
    {
        var userId = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Token không hợp lệ." });
        }

        await workers.DeleteGalleryImageAsync(userId, imageId, ct);
        return Ok(new { message = "Đã xoá hình ảnh công trình thành công." });
    }
}
