using smart_marketplace_new.models.mongo;

namespace smart_marketplace_new.dto;

public class SendMessageRequest
{
    public string ConversationId { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public TaskMetaDto? TaskMeta { get; set; }
    public List<string>? Attachments { get; set; }
}

public class StartConversationRequest
{
    public string TargetUserId { get; set; } = string.Empty;
}

public class TypingNotification
{
    public string ConversationId { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
    public bool IsTyping { get; set; }
}
