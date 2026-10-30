/**
 * Giới hạn upload ảnh của task — đồng bộ với backend TaskService
 * (smart-marketplace-new/services/TaskService.cs: MaxImages, MaxImageBytes).
 * Đổi phía backend thì cập nhật cả hai nơi.
 */
export const MAX_TASK_IMAGES = 10
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
