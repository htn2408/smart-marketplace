using smart_marketplace_new.dto;

namespace smart_marketplace_new.services;

public interface ITaskService
{
    Task<CreateTaskResponse> CreateAsync(string clientId, CreateTaskRequest request, CancellationToken ct = default);
    Task<List<TaskSuggestionResponse>> GetSuggestionsAsync(string? query, int limit, CancellationToken ct = default);
    Task<FilterTaskersResponse> FilterAndScoreWorkersAsync(string taskId, CancellationToken ct = default);

    // ═══════ TASKER: Quản lý Yêu cầu & Lịch hẹn ═══════
    Task<TaskerTaskListResponse> GetTaskerTasksAsync(string workerUserId, string? statusFilter, CancellationToken ct = default);
    Task AcceptTaskAsync(string workerUserId, string taskId, CancellationToken ct = default);
    Task DeclineTaskAsync(string workerUserId, string taskId, CancellationToken ct = default);
    Task StartTaskAsync(string workerUserId, string taskId, CancellationToken ct = default);
    Task CompleteTaskAsync(string workerUserId, string taskId, CancellationToken ct = default);

    // ═══════ CLIENT: Quản lý công việc của tôi & Nghiệm thu ═══════
    Task<ClientTaskListResponse> GetClientTasksAsync(string clientUserId, string? statusFilter, CancellationToken ct = default);
    Task AssignWorkerAsync(string clientUserId, string taskId, string workerProfileId, CancellationToken ct = default);
    Task ApproveTaskAsync(string clientUserId, string taskId, CancellationToken ct = default);
    Task CancelTaskByClientAsync(string clientUserId, string taskId, CancellationToken ct = default);
}
