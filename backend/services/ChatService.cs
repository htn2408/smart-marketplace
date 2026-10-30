using smart_marketplace_new.dto;
using smart_marketplace_new.models;
using smart_marketplace_new.models.mongo;
using smart_marketplace_new.repositories;

namespace smart_marketplace_new.services;

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepository;
    private readonly IUserRepository _userRepository;

    public ChatService(IChatRepository chatRepository, IUserRepository userRepository)
    {
        _chatRepository = chatRepository;
        _userRepository = userRepository;
    }

    public async Task<List<ConversationDocument>> GetConversationsForUserAsync(string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new InvalidCredentialsException("Token không hợp lệ.");

        return await _chatRepository.GetConversationsForUserAsync(userId);
    }

    public async Task<ConversationDocument> GetConversationByIdAsync(string conversationId, string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new InvalidCredentialsException("Token không hợp lệ.");

        var conversation = await _chatRepository.GetConversationByIdAsync(conversationId);
        if (conversation == null)
            throw new NotFoundException("Không tìm thấy cuộc trò chuyện.");

        if (!conversation.ParticipantIds.Contains(userId))
            throw new ForbiddenException("Bạn không có quyền truy cập cuộc trò chuyện này.");

        return conversation;
    }

    public async Task<List<MessageDocument>> GetMessagesAsync(
        string conversationId, string userId, int limit = 50, string? beforeId = null, CancellationToken ct = default)
    {
        // Kiểm tra quyền truy cập cuộc trò chuyện
        await GetConversationByIdAsync(conversationId, userId, ct);

        var clampedLimit = Math.Clamp(limit, 1, 100);
        return await _chatRepository.GetMessagesAsync(conversationId, clampedLimit, beforeId);
    }

    public async Task<ConversationDocument> InitConversationAsync(string currentUserId, string targetUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(currentUserId))
            throw new InvalidCredentialsException("Token không hợp lệ.");

        if (currentUserId == targetUserId)
            throw new BusinessValidationException("Không thể tạo cuộc trò chuyện với chính mình.");

        var currentUser = await _userRepository.FindByIdAsync(currentUserId, ct);
        var targetUser = await _userRepository.FindByIdAsync(targetUserId, ct);

        if (currentUser == null || targetUser == null)
            throw new NotFoundException("Người dùng không tồn tại.");

        var userADto = new ParticipantDto
        {
            UserId = currentUser.Id,
            Name = currentUser.Name,
            Role = currentUser.UserRoles.Any(r => r.Role == Role.TASKER) ? "TASKER" : "CLIENT",
            IsOnline = currentUser.WorkerProfile?.Status == "ONLINE",
            Avatar = string.Empty
        };

        var userBDto = new ParticipantDto
        {
            UserId = targetUser.Id,
            Name = targetUser.Name,
            Role = targetUser.UserRoles.Any(r => r.Role == Role.TASKER) ? "TASKER" : "CLIENT",
            IsOnline = targetUser.WorkerProfile?.Status == "ONLINE",
            Avatar = string.Empty
        };

        return await _chatRepository.GetOrCreateConversationAsync(
            currentUser.Id,
            targetUser.Id,
            userADto,
            userBDto
        );
    }

    public async Task<MessageDocument> SendMessageAsync(string senderId, SendMessageRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(senderId))
            throw new InvalidCredentialsException("Token không hợp lệ.");

        if (string.IsNullOrWhiteSpace(request.Content) && (request.Attachments == null || request.Attachments.Count == 0))
            throw new BusinessValidationException("Nội dung tin nhắn không được để trống.");

        // Kiểm tra cuộc trò chuyện và phân quyền
        var conversation = await GetConversationByIdAsync(request.ConversationId, senderId, ct);

        var message = new MessageDocument
        {
            ConversationId = request.ConversationId,
            SenderId = senderId,
            ReceiverId = request.ReceiverId,
            Content = request.Content.Trim(),
            Type = string.IsNullOrWhiteSpace(request.Type) ? "text" : request.Type,
            TaskMeta = request.TaskMeta,
            Attachments = request.Attachments ?? new List<string>(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        return await _chatRepository.CreateMessageAsync(message);
    }

    public async Task MarkAsReadAsync(string conversationId, string readerId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(readerId))
            throw new InvalidCredentialsException("Token không hợp lệ.");

        // Kiểm tra quyền tham gia cuộc trò chuyện
        await GetConversationByIdAsync(conversationId, readerId, ct);

        await _chatRepository.MarkConversationAsReadAsync(conversationId, readerId);
    }
}
