using smart_marketplace_new.models.mongo;

namespace smart_marketplace_new.repositories;

public interface IChatRepository
{
    Task<List<ConversationDocument>> GetConversationsForUserAsync(string userId);
    Task<ConversationDocument?> GetConversationByIdAsync(string conversationId);
    Task<ConversationDocument> GetOrCreateConversationAsync(string userAId, string userBId, ParticipantDto userA, ParticipantDto userB);
    Task<List<MessageDocument>> GetMessagesAsync(string conversationId, int limit = 50, string? beforeId = null);
    Task<MessageDocument> CreateMessageAsync(MessageDocument message);
    Task MarkConversationAsReadAsync(string conversationId, string readerUserId);
}
