# rule.md — Quy ước kiến trúc smart-marketplace-new

> File này là chuẩn kiến trúc của dự án. Trước khi thêm code mới (controller, service, repository, model...), đọc phần tương ứng và đối chiếu. Mọi thay đổi kiến trúc phải cập nhật file này.

---

## 1. Kiến trúc tổng thể — Layered (Controller → Service → Repository)

```
HTTP Request
   │
   ▼
Controller        (controllers/)   — mỏng: nhận request → gọi service → trả response
   │                                  validate đầu vào qua DataAnnotations của DTO
   ▼                                  KHÔNG chứa business logic, KHÔNG đụng DbContext
Service           (services/)      — business logic, chuyển đổi DTO ↔ entity
   │                                  ném exception nghiệp vụ, KHÔNG trả HTTP status
   ▼
Repository        (repositories/)  — mọi truy vấn EF Core (Where/First/Add/Save)
   │                                  service KHÔNG gọi DbContext trực tiếp
   ▼
AppDbContext      (models/)        — mapping entity ↔ bảng MySQL
```

**Luồng phụ:** exception nghiệp vụ từ Service → `middlewares/GlobalExceptionHandler.cs` → HTTP status + body `{ "error": "..." }`.

### Quy tắc cứng (vi phạm = viết lệch kiến trúc)

1. **Controller không được query DB.** Controller chỉ: bind DTO → gọi `IXxxService` → trả `ActionResult<T>`. Nếu thấy `db.Users...` hay `_dbContext` trong controller → SAI.
2. **Service không được trả HTTP status.** Service ném exception nghiệp vụ (`DuplicateResourceException`, `InvalidCredentialsException`...) và để `GlobalExceptionHandler` map sang 401/409/500. Nếu thấy `StatusCode(...)` hay `NotFound(...)` trong service → SAI.
3. **Service không được gọi `AppDbContext` trực tiếp.** Chỉ qua interface repository trong `repositories/`. Ngoại lệ duy nhất: không có.
4. **Repository không chứa business logic.** Repository chỉ có phương thức truy vấn thuần (find/exists/add/save). Nếu repository có bcrypt, check giá, gửi mail → SAI (đưa lên service).
5. **Mỗi layer phụ thuộc vào INTERFACE, không phụ thuộc class cài đặt.** Controller inject `IAuthService`, service inject `IUserRepository`. DI đăng ký trong `Program.cs` (`AddScoped` cho repository/service dùng DbContext).

---

## 2. Chức năng từng thư mục

| Thư mục | Chứa | KHÔNG chứa |
|---|---|---|
| `controllers/` | `XxxController.cs` mỏng, `[ApiController]` | business logic, EF query, bcrypt |
| `services/` | `IXxxService` + `XxxService`, exception nghiệp vụ | HTTP status, `[FromBody]`, DbContext |
| `repositories/` | `IXxxRepository` + `XxxRepository`, EF query thuần | business logic, hash, token |
| `models/` | Entity POCO + enum + `AppDbContext` | logic nghiệp vụ phức tạp |
| `dto/` | Request/Response records/classes + DataAnnotations | entity, DbContext |
| `auth/` | JWT: `JwtAuthSetup`, `JwtTokenService`, `JwtSettings`, `AuthorizeRolesAttribute` | logic riêng của feature |
| `middlewares/` | `GlobalExceptionHandler` + middleware pipeline | business logic |
| `validation/` | (chờ dùng) validator ngoài DataAnnotations nếu phức tạp | — |

**Không tạo file JS trong dự án này.** Đây là dự án .NET thuần; tài liệu tham chiếu từ backend Node ở repo `smart-marketplace-BE`, port xong thì port bằng C#.

---

## 3. Công thức thêm một feature mới (ví dụ: Task)

1. **Entity** (nếu chưa có): tạo trong `models/` theo schema MySQL — xem mục 5.
2. **DTO**: `dto/CreateTaskRequest.cs`, `dto/TaskResponse.cs` — DataAnnotations validate (`[Required]`, `[Range]`, `[MaxLength]`...), message lỗi tiếng Việt.
3. **Repository**: `repositories/ITaskRepository.cs` + `TaskRepository.cs` — chỉ phương thức truy vấn cần dùng, nhận `CancellationToken`, trả entity hoặc bool.
4. **Service**: `services/ITaskService.cs` + `TaskService.cs` — business logic; lỗi nghiệp vụ ném exception từ `services/AuthExceptions.cs` (hoặc thêm exception mới ở cùng file, đổi tên file thành `BusinessExceptions.cs` khi có nhiều domain).
5. **Controller**: `controllers/TaskController.cs` — `[ApiController]`, `[Route("api/tasks")]`, inject `ITaskService`; phân quyền bằng `[AuthorizeRoles("CLIENT")]` / `[AuthorizeRoles("CLIENT", "WORKER")]` (claim `role` từ JWT).
6. **DI trong Program.cs**: `AddScoped<ITaskRepository, TaskRepository>()`, `AddScoped<ITaskService, TaskService>()`.

---

## 4. Mapping lỗi → HTTP status (chỉ sửa ở GlobalExceptionHandler)

| Exception (services/) | HTTP | Khi nào |
|---|---|---|
| `DuplicateResourceException` | 409 | email/SĐT/unique đã tồn tại |
| `InvalidCredentialsException` | 401 | sai thông tin đăng nhập, user không tồn tại theo token |
| (chưa có) `ForbiddenException` | 403 | — thêm khi cần |
| (chưa có) `NotFoundException` | 404 | — thêm khi cần |
| mọi exception khác | 500 | log full + trả thông báo chung "Lỗi máy chủ nội bộ." |

Body lỗi thống nhất: `{ "error": "<thông báo tiếng Việt>" }`. Validate DTO thất bại → ASP.NET tự trả 400 (không cần code).

---

## 5. Quy ước Model / EF Core / MySQL

- **Tên bảng**: `[Table("tên_bảng_snake_case")]` — khớp Prisma schema: `users`, `worker_profiles`, `skill_categories`, `skills`, `worker_skills`, `tasks`, `task_images`, `invoices`.
- **Tên cột**: `[Column("tên_cột")]` snake_case — **trừ** `skills.categoryId` (DB giữ camelCase).
- **Tên entity C#**: `Task` → `TaskItem`, `TaskStatus` → `TaskItemStatus` (trùng `System.Threading.Tasks`). Tên bảng DB không đổi.
- **Enum**: lưu chuỗi — bắt buộc `HasConversion<string>()` trong `AppDbContext.OnModelCreating` cho mọi property enum khớp cột `ENUM(...)` của MySQL (đã gặp bug: thiếu → `InvalidCastException` lúc INSERT).
- **Khóa chính**: `varchar(36)` UUID, `Guid.NewGuid().ToString()` mặc định trong entity.
- **Decimal precision**: `[Column("...", TypeName = "decimal(12,2)")]` (tiền), `decimal(10,8)`/`decimal(11,8)` (toạ độ), `decimal(3,2)` (rating) — khớp `@db.Decimal` của Prisma.
- **Unique index + delete behavior + default giá trị DB**: cấu hình trong `AppDbContext.OnModelCreating` (Fluent API), không annotate lẻ tẻ.
- **PK tổng hợp**: Fluent API `HasKey(x => new { ... })` (hiện có: `WorkerSkill`).
- **Password KHÔNG bao giờ** xuất hiện trong DTO/response. `UserResponse` chỉ: id, email, name, phoneNumber, role, createdAt.

---

## 6. Quy ước Auth / JWT

- **Payload token**: chỉ `{ id, role }` — **không** đưa name/email/balance vào token (payload chỉ base64, ai cũng đọc được; đổi name thì token stale 24h).
- Token phát hành qua `IJwtTokenService.CreateToken(userId, role)`; role là chuỗi `"CLIENT"` / `"WORKER"`.
- Lấy user hiện tại trong controller: `User.FindFirst("id")?.Value` — sau đó service tra DB nếu cần profile.
- Endpoint public: `[AllowAnonymous]`; cần đăng nhập: `[Authorize]`; cần role: `[AuthorizeRoles("...")]`.
- JWT key: chỉ trong `appsettings.Development.json` hoặc biến môi trường `Jwt__Key` — **không commit key thật**; thiếu/ngắn <32 ký tự → app fail-fast khi start (đúng thiết kế).
- Login **theo email** (cột unique). `name` không unique — tuyệt đối không tra user theo name.
- Mật khẩu: `BCrypt.Net.BCrypt.HashPassword(...)` khi đăng ký; `Verify` khi login; **luôn chạy Verify cả khi user không tồn tại** (dummy hash) để chống timing attack.

---

## 7. Quy ước API / Response

- Route: `api/<domain>/[action]` — `api/auth/register`, `api/tasks`, `api/tasks/{id}`.
- Status: `201` tạo mới, `200` thành công, `400` validate, `401` chưa xác thực/sai thông tin, `403` sai role, `404` không tìm thấy, `409` trùng tài nguyên.
- Thông báo lỗi/tin nhắn API: **tiếng Việt** (thống nhất — không trộn tiếng Anh như bản Node cũ).
- Body thành công của register: `{ message, user }`; login: `{ token, user: { id, name, email, role } }`; `/me`: profile đầy đủ (nguồn chân truth để FE hiện "Hello {name}").
- FE giữ token ở localStorage (chấp nhận ở giai đoạn này) — payload JWT phải luôn tối giản (mục 6).

---

## 8. Checklist trước khi commit code mới

- [ ] Controller có query DB / bcrypt / logic → **chuyển xuống service**
- [ ] Service trả HTTP status / đụng DbContext → **ném exception / thêm repository**
- [ ] Repository có business logic → **chuyển lên service**
- [ ] Thêm bảng mới nhưng quên `HasConversion<string>()` cho enum → **sẽ lỗi lúc INSERT**
- [ ] DTO response có password/balance → **xóa ngay**
- [ ] Thông báo lỗi tiếng Anh hoặc qua `Console.WriteLine` → **dùng GlobalExceptionHandler + tiếng Việt**
- [ ] Quên đăng ký DI trong `Program.cs` → **500 lúc runtime, không phải lúc build**
- [ ] `dotnet build` phải 0 warning 0 error trước khi xong việc
