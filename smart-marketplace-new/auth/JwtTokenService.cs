using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace smart_marketplace_new.auth;

// Service cấp JWT — dùng cho luồng đăng nhập (payload { id, role }
// giống hệt req.user mà authenticate.js gắn vào request).
public interface IJwtTokenService
{
    string CreateToken(string userId, string role);
}

public class JwtTokenService(JwtSettings settings) : IJwtTokenService
{
    public string CreateToken(string userId, string role)
    {
        var claims = new[]
        {
            new Claim("id", userId),
            new Claim("role", role),
        };

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
