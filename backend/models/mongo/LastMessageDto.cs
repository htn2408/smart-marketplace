namespace smart_marketplace_new.models.mongo;

public class LastMessageDto
{
    public string SenderId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
