using MongoDB.Bson;
using MongoDB.Driver;
using smart_marketplace_new.models.mongo;

namespace smart_marketplace_new.repositories;

public class ChatRepository : IChatRepository
{
    private readonly IMongoCollection<ConversationDocument> _conversations;
    private readonly IMongoCollection<MessageDocument> _messages;

    public ChatRepository(IMongoDatabase database)
    {
        _conversations = database.GetCollection<ConversationDocument>("conversations");
        _messages = database.GetCollection<MessageDocument>("messages");

        EnsureIndexes();
    }

    private void EnsureIndexes()
    {
        try
        {
            // Index cho tìm kiếm danh sách cuộc trò chuyện của user
            var convKeys = Builders<ConversationDocument>.IndexKeys.Ascending("participantIds").Descending("updatedAt");
            _conversations.Indexes.CreateOne(new CreateIndexModel<ConversationDocument>(convKeys));

            // Unique index cho cặp 2 người dùng (dùng PairKey thay vì array để tránh multikey unique collision)
            var pairKeyIndex = Builders<ConversationDocument>.IndexKeys.Ascending(c => c.PairKey);
            _conversations.Indexes.CreateOne(new CreateIndexModel<ConversationDocument>(pairKeyIndex, new CreateIndexOptions { Unique = true, Sparse = true }));

            // Index cho tin nhắn
            var msgKeys = Builders<MessageDocument>.IndexKeys.Ascending(m => m.ConversationId).Descending(m => m.CreatedAt);
            _messages.Indexes.CreateOne(new CreateIndexModel<MessageDocument>(msgKeys));
        }
        catch
        {
            // Bỏ qua nếu index đã tồn tại
        }
    }

    public async Task<List<ConversationDocument>> GetConversationsForUserAsync(string userId)
    {
        var filter = Builders<ConversationDocument>.Filter.AnyEq(c => c.ParticipantIds, userId);
        var sort = Builders<ConversationDocument>.Sort.Descending(c => c.UpdatedAt);
        return await _conversations.Find(filter).Sort(sort).ToListAsync();
    }

    public async Task<ConversationDocument?> GetConversationByIdAsync(string conversationId)
    {
        var filter = Builders<ConversationDocument>.Filter.Eq(c => c.Id, conversationId);
        return await _conversations.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<ConversationDocument> GetOrCreateConversationAsync(string userAId, string userBId, ParticipantDto userA, ParticipantDto userB)
    {
        var isALess = string.Compare(userAId, userBId, StringComparison.Ordinal) <= 0;
        var firstId = isALess ? userAId : userBId;
        var secondId = isALess ? userBId : userAId;
        var pairKey = $"{firstId}_{secondId}";
        var filter = Builders<ConversationDocument>.Filter.Eq(c => c.PairKey, pairKey);

        var existing = await _conversations.Find(filter).FirstOrDefaultAsync();
        if (existing != null)
        {
            return existing;
        }

        var newConv = new ConversationDocument
        {
            PairKey = pairKey,
            ParticipantIds = new List<string> { firstId, secondId },
            Participants = new List<ParticipantDto> { userA, userB },
            UnreadCounts = new Dictionary<string, int>
            {
                { userAId, 0 },
                { userBId, 0 }
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            await _conversations.InsertOneAsync(newConv);
            return newConv;
        }
        catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
        {
            return await _conversations.Find(filter).FirstAsync();
        }
    }

    public async Task<List<MessageDocument>> GetMessagesAsync(string conversationId, int limit = 50, string? beforeId = null)
    {
        var builder = Builders<MessageDocument>.Filter;
        var filter = builder.Eq(m => m.ConversationId, conversationId);

        if (!string.IsNullOrEmpty(beforeId) && ObjectId.TryParse(beforeId, out _))
        {
            filter &= builder.Lt(m => m.Id, beforeId);
        }

        var sort = Builders<MessageDocument>.Sort.Descending(m => m.CreatedAt);
        var items = await _messages.Find(filter).Sort(sort).Limit(limit).ToListAsync();

        items.Reverse();
        return items;
    }

    public async Task<MessageDocument> CreateMessageAsync(MessageDocument message)
    {
        message.CreatedAt = DateTime.UtcNow;
        await _messages.InsertOneAsync(message);

        var update = Builders<ConversationDocument>.Update
            .Set(c => c.LastMessage, new LastMessageDto
            {
                SenderId = message.SenderId,
                Content = message.Content,
                Type = message.Type,
                CreatedAt = message.CreatedAt
            })
            .Set(c => c.UpdatedAt, message.CreatedAt)
            .Inc($"unreadCounts.{message.ReceiverId}", 1);

        await _conversations.UpdateOneAsync(
            Builders<ConversationDocument>.Filter.Eq(c => c.Id, message.ConversationId),
            update
        );

        return message;
    }

    public async Task MarkConversationAsReadAsync(string conversationId, string readerUserId)
    {
        var updateConv = Builders<ConversationDocument>.Update.Set($"unreadCounts.{readerUserId}", 0);
        await _conversations.UpdateOneAsync(
            Builders<ConversationDocument>.Filter.Eq(c => c.Id, conversationId),
            updateConv
        );

        var updateMsg = Builders<MessageDocument>.Update
            .Set(m => m.IsRead, true)
            .Set(m => m.ReadAt, DateTime.UtcNow);

        var filterMsg = Builders<MessageDocument>.Filter.And(
            Builders<MessageDocument>.Filter.Eq(m => m.ConversationId, conversationId),
            Builders<MessageDocument>.Filter.Eq(m => m.ReceiverId, readerUserId),
            Builders<MessageDocument>.Filter.Eq(m => m.IsRead, false)
        );

        await _messages.UpdateManyAsync(filterMsg, updateMsg);
    }
}
