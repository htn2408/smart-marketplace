using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.auth;
using smart_marketplace_new.middlewares;
using smart_marketplace_new.models;
using smart_marketplace_new.repositories;
using smart_marketplace_new.services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// CORS for Frontend (Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// MySQL (Pomelo) — serverVersion khớp MySQL 8.0 theo dump
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Thiếu ConnectionStrings:DefaultConnection.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Repository + Service layer
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();

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
