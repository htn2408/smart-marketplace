namespace smart_marketplace_new.services;

// 400 — dữ liệu hợp lệ về định dạng nhưng vi phạm rule nghiệp vụ
// (ví dụ: thời gian bắt đầu ở quá khứ, quá 10 ảnh, ảnh quá lớn).
// Map sang HTTP 400 ở GlobalExceptionHandler.
public class BusinessValidationException(string message) : Exception(message);
