using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using smart_marketplace_new.dto;
using smart_marketplace_new.models;

namespace smart_marketplace_new.controllers;

[ApiController]
[Route("api/services")]
public class ServicesController(AppDbContext db) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories(CancellationToken ct)
    {
        // Tự động bổ sung danh mục "Khoan tường & Lắp đặt" nếu chưa có trong DB để đủ bộ TaskRabbit
        if (!await db.SkillCategories.AnyAsync(c => c.Name == "Khoan tường & Lắp đặt", ct))
        {
            var cat = new SkillCategory
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Khoan tường & Lắp đặt",
                Skills = new List<Skill>
                {
                    new() { Id = Guid.NewGuid().ToString(), Name = "Treo TV lên tường" },
                    new() { Id = Guid.NewGuid().ToString(), Name = "Gắn giá kệ & móc treo" },
                    new() { Id = Guid.NewGuid().ToString(), Name = "Treo gương & tranh nghệ thuật" },
                    new() { Id = Guid.NewGuid().ToString(), Name = "Lắp rèm cửa sổ & màn che" },
                    new() { Id = Guid.NewGuid().ToString(), Name = "Lắp quạt trần & đèn chùm" },
                    new() { Id = Guid.NewGuid().ToString(), Name = "Khoan tường chuẩn laser thăng bằng" }
                }
            };
            db.SkillCategories.Add(cat);
            await db.SaveChangesAsync(ct);
        }

        var dbCategories = await db.SkillCategories
            .Include(c => c.Skills)
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

        var result = dbCategories.Select(c =>
        {
            var meta = GetCategoryMetadata(c.Name);
            return new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Subtitle = meta.Subtitle,
                ImageUrl = meta.ImageUrl,
                Slug = meta.Slug,
                Jobs = c.Skills.Select(s => new CategorySkillDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = $"Dịch vụ {s.Name.ToLowerInvariant()} chuyên nghiệp, thợ uy tín tại nhà.",
                    SuggestedPrice = 250000m + (Math.Abs(s.Id.GetHashCode()) % 4) * 50000m,
                    Icon = MapSkillToIcon(s.Name)
                }).OrderBy(s => s.Name).ToList()
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("categories/{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(string id, CancellationToken ct)
    {
        var category = await db.SkillCategories
            .Include(c => c.Skills)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null) return NotFound(new { message = "Không tìm thấy danh mục" });

        var meta = GetCategoryMetadata(category.Name);
        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Subtitle = meta.Subtitle,
            ImageUrl = meta.ImageUrl,
            Slug = meta.Slug,
            Jobs = category.Skills.Select(s => new CategorySkillDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = $"Dịch vụ {s.Name.ToLowerInvariant()} chuyên nghiệp, thợ uy tín tại nhà.",
                SuggestedPrice = 300000m,
                Icon = MapSkillToIcon(s.Name)
            }).OrderBy(s => s.Name).ToList()
        };

        return Ok(result);
    }

    private static (string Subtitle, string ImageUrl, string Slug) GetCategoryMetadata(string name)
    {
        var lower = name.ToLowerInvariant();
        if (lower.Contains("lắp ráp") || lower.Contains("nội thất"))
            return ("Lắp ráp nội thất gia đình, đồ IKEA, giường tủ, bàn làm việc, kệ sách nhanh chóng.", "/images/services/assembly.jpg", "furniture-assembly");

        if (lower.Contains("vận chuyển") || lower.Contains("chuyển"))
            return ("Chuyển nhà trọn gói, bốc xếp hàng hoá, xe tải hỗ trợ, khuân vác đồ nặng cẩn trọng.", "/images/services/moving.jpg", "moving");

        if (lower.Contains("giao hàng") || lower.Contains("giao") || lower.Contains("mua"))
            return ("Giao nhận bưu kiện, chuyển đồ trong ngày, mua sắm đồ tạp hóa & giao tận cửa.", "/images/services/delivery.jpg", "delivery");

        if (lower.Contains("sân vườn") || lower.Contains("vườn") || lower.Contains("cây"))
            return ("Cắt cỏ, dọn dẹp cành lá, cắt tỉa và chăm sóc cây cảnh sân thượng, biệt thự.", "/images/services/yardwork.jpg", "yardwork");

        if (lower.Contains("vệ sinh") || lower.Contains("dọn"))
            return ("Dọn dẹp nhà ở, căn hộ chung cư, tổng vệ sinh sâu, khử khuẩn không gian sống.", "/images/services/cleaning.jpg", "cleaning");

        if (lower.Contains("khoan") || lower.Contains("treo") || lower.Contains("gắn"))
            return ("Khoan tường chuẩn laser, treo TV, giá kệ, khung tranh nghệ thuật, rèm cửa sổ an toàn.", "/images/services/mounting.jpg", "mounting");

        if (lower.Contains("điện") || lower.Contains("nước") || lower.Contains("sửa"))
            return ("Khắc phục sự cố điện gia dụng, đường ống nước, bảo trì trang thiết bị nhà tắm, bếp.", "/images/services/handyman.jpg", "handyman");

        return ("Dịch vụ hỗ trợ tại nhà bởi đội ngũ thợ lành nghề, được thẩm định lý lịch kỹ càng.", "/images/services/handyman.jpg", "general-service");
    }

    private static string MapSkillToIcon(string skillName)
    {
        var lower = skillName.ToLowerInvariant();
        if (lower.Contains("ikea") || lower.Contains("bàn") || lower.Contains("ghế") || lower.Contains("giường") || lower.Contains("tủ") || lower.Contains("kệ"))
            return "chair";
        if (lower.Contains("xe") || lower.Contains("chuyển") || lower.Contains("bốc") || lower.Contains("vác"))
            return "local_shipping";
        if (lower.Contains("cỏ") || lower.Contains("cây") || lower.Contains("vườn"))
            return "yard";
        if (lower.Contains("giao") || lower.Contains("bưu") || lower.Contains("hàng"))
            return "delivery_dining";
        if (lower.Contains("điện") || lower.Contains("đèn"))
            return "bolt";
        if (lower.Contains("nước") || lower.Contains("vòi") || lower.Contains("ống"))
            return "water_damage";
        if (lower.Contains("khoan") || lower.Contains("treo") || lower.Contains("tv") || lower.Contains("rèm") || lower.Contains("gương"))
            return "tv";
        if (lower.Contains("vệ sinh") || lower.Contains("dọn"))
            return "cleaning_services";
        return "handyman";
    }
}
