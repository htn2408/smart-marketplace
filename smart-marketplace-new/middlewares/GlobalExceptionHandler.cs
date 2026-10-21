using Microsoft.AspNetCore.Diagnostics;
using smart_marketplace_new.services;

namespace smart_marketplace_new.middlewares;

// Handler exception tập trung: exception nghiệp vụ ném từ service layer
// được map về HTTP status + body JSON { error } thống nhất.
// Controller/service không phải try-catch để set status nữa.
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, message) = exception switch
        {
            DuplicateResourceException dup => (StatusCodes.Status409Conflict, dup.Message),
            InvalidCredentialsException auth => (StatusCodes.Status401Unauthorized, auth.Message),
            NotFoundException notFound => (StatusCodes.Status404NotFound, notFound.Message),
            ForbiddenException forbidden => (StatusCodes.Status403Forbidden, forbidden.Message),
            BusinessValidationException validation => (StatusCodes.Status400BadRequest, validation.Message),

            // Lỗi không lường trước: log đầy đủ, trả thông báo chung (không lộ chi tiết)
            _ => (StatusCodes.Status500InternalServerError, "Lỗi máy chủ nội bộ."),
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception khi xử lý {Method} {Path}",
                httpContext.Request.Method, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(new { error = message }, cancellationToken);
        return true;
    }
}
