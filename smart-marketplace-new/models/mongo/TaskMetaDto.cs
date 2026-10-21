namespace smart_marketplace_new.models.mongo;

public class TaskMetaDto
{
    public int TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public string? Status { get; set; }
}
