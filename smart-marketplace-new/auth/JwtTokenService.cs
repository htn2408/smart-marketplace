using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace smart_marketplace_new.auth;

// Service cấp JWT — hỗ trợ nhiều role cho 1 người dùng (từ bảng user_roles).
public interface IJwtTokenService
{
    string CreateToken(string userId, IEnumerable<string> roles);
}

public class JwtTokenService(JwtSettings settings) : IJwtTokenService
{
    public string CreateToken(string userId, IEnumerable<string> roles)
    {
        var claims = new List<Claim>
        {
            new("id", userId),
        };

        foreach (var role in roles.Distinct())
        {
            claims.Add(new Claim("role", role));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: settings.Issuer,
            audience: settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(settings.ExpiresMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
