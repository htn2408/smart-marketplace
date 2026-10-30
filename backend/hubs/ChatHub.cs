using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using smart_marketplace_new.dto;
using smart_marketplace_new.services;

namespace smart_marketplace_new.hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("id")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("id")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv_{conversationId}");
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conv_{conversationId}");
    }

    public async Task SendMessage(SendMessageRequest request)
    {
        var senderId = Context.User?.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(senderId))
        {
            throw new HubException("Token không hợp lệ.");
        }

        var saved = await _chatService.SendMessageAsync(senderId, request);

        // Gửi tin nhắn đến cả người nhận và người gửi (tất cả các tab/thiết bị đang mở)
        await Clients.Group($"user_{request.ReceiverId}").SendAsync("ReceiveMessage", saved);
        await Clients.Group($"user_{senderId}").SendAsync("ReceiveMessage", saved);
    }

    public async Task MarkAsRead(string conversationId)
    {
        var readerId = Context.User?.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(readerId)) return;

        await _chatService.MarkAsReadAsync(conversationId, readerId);

        var conv = await _chatService.GetConversationByIdAsync(conversationId, readerId);
        var otherUserId = conv.ParticipantIds.FirstOrDefault(id => id != readerId);
        if (!string.IsNullOrEmpty(otherUserId))
        {
            await Clients.Group($"user_{otherUserId}").SendAsync("MessagesRead", new
            {
                conversationId,
                readerUserId = readerId
            });
        }
    }

    public async Task SendTyping(TypingNotification notification)
    {
        var senderId = Context.User?.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(senderId)) return;

        await Clients.Group($"user_{notification.ReceiverId}").SendAsync("UserTyping", new
        {
            conversationId = notification.ConversationId,
            senderId,
            isTyping = notification.IsTyping
        });
    }
}
