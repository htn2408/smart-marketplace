using System.ComponentModel.DataAnnotations;

namespace smart_marketplace_new.dto;

public class FilterTaskersRequest
{
    [Required(ErrorMessage = "taskId là bắt buộc.")]
    public string TaskId { get; set; } = null!;
}
