namespace smart_marketplace_new.auth;

// Cấu hình JWT, bind từ section "Jwt" trong appsettings
// (hoặc biến môi trường Jwt__Key, Jwt__Issuer, ... khi deploy).
public class JwtSettings
{
    public const string SectionName = "Jwt";

    // Khóa ký token (tối thiểu 32 ký tự cho HS256).
    // Chỉ đặt trong appsettings.Development.json hoặc biến môi trường, không commit key thật.
    public string Key { get; set; } = null!;

    public string Issuer { get; set; } = "smart-marketplace";
    public string Audience { get; set; } = "smart-marketplace";

    // Thời gian sống của token, đơn vị phút
    public int ExpiresMinutes { get; set; } = 60 * 24;
}
