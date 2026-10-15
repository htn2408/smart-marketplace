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
}
