namespace smart_marketplace_new.dto;

// Response của POST /api/tasks — 201
public class CreateTaskResponse
{
    public string Message { get; set; } = "Tạo task thành công.";
    public TaskInfo Task { get; set; } = null!;

    public class TaskInfo
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string City { get; set; } = null!;
        public string District { get; set; } = null!;
        public string? Address { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string Status { get; set; } = null!;
        public DateTime ScheduledStartTime { get; set; }
        public int ExpectedTime { get; set; }
        public decimal OfferedPrice { get; set; }
        public List<ImageInfo> Images { get; set; } = new();
        public SkillInfo RequiredSkill { get; set; } = null!;
        public ClientInfo Client { get; set; } = null!;

        public class ImageInfo
        {
            public string ImageUrl { get; set; } = null!;
        }

        public class SkillInfo
        {
            public string Id { get; set; } = null!;
            public string Name { get; set; } = null!;
        }

        public class ClientInfo
        {
            public string Id { get; set; } = null!;
            public string Name { get; set; } = null!;
        }
    }
}
