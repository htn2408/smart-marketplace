namespace smart_marketplace_new.dto;

public class ClientTaskListResponse
{
    public ClientStatsDto Stats { get; set; } = null!;
    public List<ClientTaskDto> Tasks { get; set; } = new();

    public class ClientStatsDto
    {
        public int PendingCount { get; set; }
        public int MatchedCount { get; set; }
        public int InProgressCount { get; set; }
        public int AwaitingApprovalCount { get; set; }
        public int DoneCount { get; set; }
        public int CancelledCount { get; set; }
    }

    public class ClientTaskDto
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Category { get; set; } = null!;
        public string SkillName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public WorkerBriefDto? Worker { get; set; }
        public string City { get; set; } = null!;
        public string District { get; set; } = null!;
        public string? Address { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime ScheduledStartTime { get; set; }
        public int ExpectedTime { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }
        public decimal OfferedPrice { get; set; }
        public List<string> Images { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? OfferExpiresAt { get; set; }
    }

    public class WorkerBriefDto
    {
        public string Id { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public decimal Rating { get; set; }
        public int CompletedTasks { get; set; }
    }
}
