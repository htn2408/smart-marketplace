namespace smart_marketplace_new.models.mongo;

public class ParticipantDto
{
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = "CLIENT"; // CLIENT or TASKER
    public string Name { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public bool IsOnline { get; set; } = false;
    public string? ResponseSpeed { get; set; }
}
