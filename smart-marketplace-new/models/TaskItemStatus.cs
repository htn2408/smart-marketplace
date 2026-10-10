namespace smart_marketplace_new.models;

// Tên "TaskStatus" trùng với System.Threading.Tasks.TaskStatus của .NET
// nên enum được đặt thành TaskItemStatus (ứng với entity TaskItem).
public enum TaskItemStatus
{
    PENDING,             // Khách mới đăng, chưa có Worker nhận
    MATCHED,             // Worker đã nhận task, chờ đến giờ làm
    IN_PROGRESS,         // Worker bấm "Start Task"
    AWAITING_APPROVAL,   // Worker bấm "End Task", chờ Khách xác nhận hóa đơn
    DONE,                // Khách đã duyệt, tiền đã chuyển cho Worker
    CANCELLED,           // Hủy task
}
