namespace smart_marketplace_new.dto;

public class FilterTaskersResponse
{
    public TaskBriefDto Task { get; set; } = null!;
    public int TotalCandidates { get; set; }
    public List<ScoredCandidateDto> Results { get; set; } = new();

    public class TaskBriefDto
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string City { get; set; } = null!;
        public string District { get; set; } = null!;
        public string Status { get; set; } = null!;
        public SkillBriefDto RequiredSkill { get; set; } = null!;
        public ClientBriefDto Client { get; set; } = null!;
    }

    public class SkillBriefDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class ClientBriefDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class ScoredCandidateDto
    {
        public CandidateInfoDto Candidate { get; set; } = null!;
        public ScoreBreakdownDto ScoreBreakdown { get; set; } = null!;
        public double MatchingScore { get; set; }
    }

    public class CandidateInfoDto
    {
        public string Id { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string Name { get; set; } = null!;
        // Không trả Email/PhoneNumber — PII chỉ chia sẻ sau khi client gửi offer
        public string? Description { get; set; }
        public string Status { get; set; } = "ONLINE";
        public decimal Rating { get; set; }
        public int CompletedTasks { get; set; }
        public List<SkillBriefDto> Skills { get; set; } = new();
        public List<UserResponse.WorkerDistrictDto> ServiceDistricts { get; set; } = new();
    }

    public class ScoreBreakdownDto
    {
        public double RatingScore { get; set; }
        public double ExperienceScore { get; set; }
    }
}
