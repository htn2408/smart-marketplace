namespace smart_marketplace_new.dto;

public class TaskSuggestionResponse
{
    public string SkillId { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string CategoryName { get; set; } = null!;
    public string? Icon { get; set; }
    public decimal? SuggestedPrice { get; set; }
    public int? EstimatedMinutes { get; set; }
}
