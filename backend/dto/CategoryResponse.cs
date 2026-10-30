namespace smart_marketplace_new.dto;

public class CategorySkillDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? SuggestedPrice { get; set; }
    public string? Icon { get; set; }
}

public class CategoryDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Subtitle { get; set; }
    public string? ImageUrl { get; set; }
    public string? Slug { get; set; }
    public int JobCount => Jobs.Count;
    public List<CategorySkillDto> Jobs { get; set; } = new();
}
