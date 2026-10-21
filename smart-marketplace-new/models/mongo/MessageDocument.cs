using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace smart_marketplace_new.models.mongo;

public class MessageDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonElement("conversationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string ConversationId { get; set; } = null!;

    [BsonElement("senderId")]
    public string SenderId { get; set; } = string.Empty;

    [BsonElement("receiverId")]
    public string ReceiverId { get; set; } = string.Empty;

    [BsonElement("type")]
    public string Type { get; set; } = "text"; // "text", "image", "file", "task_card", "system"

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("taskMeta")]
    public TaskMetaDto? TaskMeta { get; set; }

    [BsonElement("attachments")]
    public List<string> Attachments { get; set; } = new();

    [BsonElement("isRead")]
    public bool IsRead { get; set; } = false;

    [BsonElement("readAt")]
    public DateTime? ReadAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
