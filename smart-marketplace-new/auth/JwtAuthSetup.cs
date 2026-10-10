using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace smart_marketplace_new.auth;

// Port của middlewares/authenticate.js sang ASP.NET Core.
//
// Quy trình tương đương:
//   1. Đọc header Authorization: Bearer <token>  (JwtBearer tự làm)
//   2. Verify token (chữ ký + hạn sử dụng)       (TokenValidationParameters)
//   3. Gắn payload vào HttpContext.User dưới dạng claims "id" và "role"
//      (tương đương req.user = { id, role } bên Express)
//
// Khác với bản JS, khóa JWT bị thiếu/ngắn sẽ làm app chết ngay khi khởi động
// (fail fast) thay vì trả 401 "Token không hợp lệ" cho mọi request.
public static class JwtAuthSetup
{
    public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var settings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
            ?? throw new InvalidOperationException(
                "Thiếu cấu hình JWT: chưa khai báo section 'Jwt' (Key, Issuer, Audience).");

        if (string.IsNullOrWhiteSpace(settings.Key) || settings.Key.Length < 32)
        {
            throw new InvalidOperationException(
                "JWT Key chưa được đặt hoặc ngắn hơn 32 ký tự. " +
                "Đặt biến môi trường Jwt__Key (production) hoặc section Jwt:Key (development).");
        }

        services.AddSingleton(settings);

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // Giữ nguyên claim "id", "role" như payload JWT, không map sang ClaimTypes dài
                options.MapInboundClaims = false;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = settings.Issuer,

                    ValidateAudience = true,
                    ValidAudience = settings.Audience,

                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)),

                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),

                    // Chỉ chấp nhận HS256, chặn algorithm-confusion
                    ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },

                    // claim "role" dùng cho [AuthorizeRoles], claim "id" làm định danh user
                    RoleClaimType = "role",
                    NameClaimType = "id",
                };

                options.Events = new JwtBearerEvents
                {
                    // Trả body JSON tiếng Việt thay vì 401/403 rỗng,
                    // đúng các thông báo của authenticate.js / authorize.js
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();

                        string message;
                        if (context.AuthenticateFailure is SecurityTokenExpiredException)
                            message = "Token đã hết hạn. Vui lòng đăng nhập lại.";
                        else if (string.IsNullOrEmpty(context.Request.Headers.Authorization))
                            message = "Không có token. Vui lòng đăng nhập.";
                        else
                            message = "Token không hợp lệ.";

                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json; charset=utf-8";
                        await context.Response.WriteAsync($$"""{"error":"{{message}}"}""");
                    },

                    // Đã xác thực đúng nhưng role không được phép (tương đương 403 của authorize.js)
                    OnForbidden = async context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json; charset=utf-8";
                        await context.Response.WriteAsync(
                            $$"""{"error":"Bạn không có quyền thực hiện hành động này."}""");
                    },
                };
            });

        services.AddAuthorization();

        return services;
    }
}
