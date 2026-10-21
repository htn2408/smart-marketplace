using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace smart_marketplace_new.models.mongo;

public class ConversationDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonElement("pairKey")]
    public string PairKey { get; set; } = string.Empty;

    [BsonElement("participantIds")]
    public List<string> ParticipantIds { get; set; } = new();

    [BsonElement("participants")]
    public List<ParticipantDto> Participants { get; set; } = new();

    [BsonElement("lastMessage")]
    public LastMessageDto? LastMessage { get; set; }

    [BsonElement("unreadCounts")]
    public Dictionary<string, int> UnreadCounts { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
