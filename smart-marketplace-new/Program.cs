using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.auth;
using smart_marketplace_new.middlewares;
using smart_marketplace_new.models;
using smart_marketplace_new.repositories;
using smart_marketplace_new.services;

// 1. Tự động đọc và nạp cấu hình từ file .env (nếu có) vào Environment Variables
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#'))
            continue;

        var separatorIndex = trimmed.IndexOf('=');
        if (separatorIndex > 0)
        {
            var key = trimmed[..separatorIndex].Trim();
            var value = trimmed[(separatorIndex + 1)..].Trim().Trim('"', '\'');
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

// Hỗ trợ tự sinh connection string nếu người dùng cấu hình các biến rời rạc DB_*
var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
if (!string.IsNullOrEmpty(dbHost) && !string.IsNullOrEmpty(dbName) &&
    string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")))
{
    var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
    var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
    var dbPass = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";
    var generatedConn = $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPass};";
    Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", generatedConn);
}

// Hỗ trợ alias JWT_SECRET -> Jwt__Key
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
if (!string.IsNullOrEmpty(jwtSecret) && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("Jwt__Key")))
{
    Environment.SetEnvironmentVariable("Jwt__Key", jwtSecret);
}

var builder = WebApplication.CreateBuilder(args);

// Đảm bảo biến môi trường và .env được ưu tiên nạp đè lên appsettings.json
builder.Configuration.AddEnvironmentVariables();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// CORS for Frontend (Vite)
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS")?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// MySQL (Pomelo) — serverVersion khớp MySQL 8.0 theo dump
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Thiếu ConnectionStrings:DefaultConnection (cần cấu hình trong .env hoặc appsettings.json).");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Repository + Service layer
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IServiceCategoryRepository, ServiceCategoryRepository>();
builder.Services.AddScoped<IServiceCategoryService, ServiceCategoryService>();
builder.Services.AddScoped<IWorkerService, WorkerService>();

// Ảnh: bản dev giả lập (chưa có Cloudinary credentials).
// Khi có account: thay bằng CloudinaryImageStorage (xem LocalImageStorage.cs)
builder.Services.AddSingleton<IImageStorage, LocalImageStorage>();

// JWT auth (port của middlewares/authenticate.js) + authorization
builder.Services.AddJwtAuth(builder.Configuration);
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

builder.Services.AddControllers();

// Exception nghiệp vụ → HTTP status (401/409/500)
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Endpoint minh hoạ đọc claims từ token (tương đương req.user bên Express).
// GET /me với "Authorization: Bearer <token>" từ /api/auth/login.
app.MapGet("/me", (ClaimsPrincipal user) =>
{
    return Results.Ok(new
    {
        id = user.FindFirst("id")?.Value,
        role = user.FindFirst("role")?.Value,
    });
})
.RequireAuthorization();

app.Run();
