using smart_marketplace_new.dto;

namespace smart_marketplace_new.services;

public interface ITaskService
{
    Task<CreateTaskResponse> CreateAsync(string clientId, CreateTaskRequest request, CancellationToken ct = default);
    Task<List<TaskSuggestionResponse>> GetSuggestionsAsync(string? query, int limit, CancellationToken ct = default);
    Task<FilterTaskersResponse> FilterAndScoreWorkersAsync(string taskId, CancellationToken ct = default);
}
