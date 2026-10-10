using Microsoft.AspNetCore.Authorization;

namespace smart_marketplace_new.auth;

// Port của middlewares/authorize.js.
//
// Cách dùng (trên controller/action khi có controllers):
//   [AuthorizeRoles("CLIENT")]
//   [AuthorizeRoles("CLIENT", "WORKER")]
//
// Phải có JWT hợp lệ trước (token hợp lệ thì mới đến bước xét role),
// tương đương thứ tự authenticate -> authorize bên Express.
// Role lấy từ claim "role" trong token (RoleClaimType cấu hình trong JwtAuthSetup).
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class AuthorizeRolesAttribute : AuthorizeAttribute
{
    public AuthorizeRolesAttribute(params string[] roles)
    {
        if (roles.Length == 0)
        {
            throw new ArgumentException("Cần chỉ định ít nhất một role.", nameof(roles));
        }

        // Gán Roles (không phải policy) — khớp claim "role" trong JWT
        Roles = string.Join(",", roles);
    }
}
