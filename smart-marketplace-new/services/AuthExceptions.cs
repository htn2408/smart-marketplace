namespace smart_marketplace_new.services;

// Lỗi nghiệp vụ — middlewares/GlobalExceptionHandler map thành HTTP status tương ứng
// (DuplicateResourceException → 409, InvalidCredentialsException → 401).

public class DuplicateResourceException(string message) : Exception(message);

public class InvalidCredentialsException(string message) : Exception(message);
