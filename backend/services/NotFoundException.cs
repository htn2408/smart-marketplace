namespace smart_marketplace_new.services;

// 404 — tài nguyên không tồn tại (skill, task, user...)
// Map sang HTTP 404 ở GlobalExceptionHandler.
public class NotFoundException(string message) : Exception(message);
