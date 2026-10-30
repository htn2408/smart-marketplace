using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using smart_marketplace_new.dto;
using smart_marketplace_new.hubs;
using smart_marketplace_new.models.mongo;
using smart_marketplace_new.services;

namespace smart_marketplace_new.controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatController(IChatService chatService, IHubContext<ChatHub> hubContext)
    {
        _chatService = chatService;
        _hubContext = hubContext;
    }

    private string CurrentUserId =>
        User.FindFirst("id")?.Value ?? throw new InvalidCredentialsException("Token không hợp lệ.");

    // Lấy danh sách cuộc trò chuyện của người dùng hiện tại
    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationDocument>>> GetConversations(CancellationToken ct)
    {
        var conversations = await _chatService.GetConversationsForUserAsync(CurrentUserId, ct);
        return Ok(conversations);
    }

    // Lấy chi tiết một cuộc trò chuyện
    [HttpGet("conversations/{id}")]
    public async Task<ActionResult<ConversationDocument>> GetConversationById(string id, CancellationToken ct)
    {
        var conversation = await _chatService.GetConversationByIdAsync(id, CurrentUserId, ct);
        return Ok(conversation);
    }

    // Lấy lịch sử tin nhắn của một cuộc trò chuyện (hỗ trợ phân trang)
    [HttpGet("conversations/{id}/messages")]
    public async Task<ActionResult<List<MessageDocument>>> GetMessages(
        string id,
        [FromQuery] int limit = 50,
        [FromQuery] string? beforeId = null,
        CancellationToken ct = default)
    {
        var messages = await _chatService.GetMessagesAsync(id, CurrentUserId, limit, beforeId, ct);
        return Ok(messages);
    }

    // Khởi tạo hoặc lấy cuộc trò chuyện với một người dùng khác
    [HttpPost("conversations/init")]
    public async Task<ActionResult<ConversationDocument>> InitConversation(
        [FromBody] StartConversationRequest request, CancellationToken ct)
    {
        var conversation = await _chatService.InitConversationAsync(CurrentUserId, request.TargetUserId, ct);
        return Ok(conversation);
    }

    // Gửi tin nhắn qua REST API (và phát WebSocket real-time qua ChatHub)
    [HttpPost("messages")]
    public async Task<ActionResult<MessageDocument>> SendMessage(
        [FromBody] SendMessageRequest request, CancellationToken ct)
    {
        var saved = await _chatService.SendMessageAsync(CurrentUserId, request, ct);

        // Phát real-time đến cả 2 bên
        await _hubContext.Clients.Group($"user_{request.ReceiverId}").SendAsync("ReceiveMessage", saved, cancellationToken: ct);
        await _hubContext.Clients.Group($"user_{CurrentUserId}").SendAsync("ReceiveMessage", saved, cancellationToken: ct);

        return StatusCode(StatusCodes.Status201Created, saved);
    }

    // Đánh dấu đã đọc cuộc trò chuyện
    [HttpPost("conversations/{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id, CancellationToken ct)
    {
        await _chatService.MarkAsReadAsync(id, CurrentUserId, ct);

        var conv = await _chatService.GetConversationByIdAsync(id, CurrentUserId, ct);
        var otherUserId = conv.ParticipantIds.FirstOrDefault(u => u != CurrentUserId);
        if (!string.IsNullOrEmpty(otherUserId))
        {
            await _hubContext.Clients.Group($"user_{otherUserId}").SendAsync("MessagesRead", new
            {
                conversationId = id,
                readerUserId = CurrentUserId
            }, cancellationToken: ct);
        }

        return Ok(new { success = true });
    }
}
