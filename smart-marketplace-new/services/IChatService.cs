using smart_marketplace_new.dto;
using smart_marketplace_new.models.mongo;

namespace smart_marketplace_new.services;

public interface IChatService
{
    Task<List<ConversationDocument>> GetConversationsForUserAsync(string userId, CancellationToken ct = default);
    Task<ConversationDocument> GetConversationByIdAsync(string conversationId, string userId, CancellationToken ct = default);
    Task<List<MessageDocument>> GetMessagesAsync(string conversationId, string userId, int limit = 50, string? beforeId = null, CancellationToken ct = default);
    Task<ConversationDocument> InitConversationAsync(string currentUserId, string targetUserId, CancellationToken ct = default);
    Task<MessageDocument> SendMessageAsync(string senderId, SendMessageRequest request, CancellationToken ct = default);
    Task MarkAsReadAsync(string conversationId, string readerId, CancellationToken ct = default);
}
