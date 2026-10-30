namespace smart_marketplace_new.services;

// Logic thuần của matching engine, tách thành static để unit test được
// mà không cần database (TaskService chỉ gọi qua).
public static class MatchingScorer
{
    public const double RatingWeight = 0.60;
    public const double ExperienceWeight = 0.40;

    // Đánh giá sao 0..5 chuẩn hóa về 0..1 (rating ngoài khoảng bị clamp)
    public static double CalculateRatingScore(decimal rating)
    {
        var r = (double)rating;
        return Math.Clamp(r, 0.0, 5.0) / 5.0;
    }

    // Kinh nghiệm: 50 việc hoàn thành trở lên đạt điểm tối đa
    public static double CalculateExperienceScore(int completedTasks)
    {
        if (completedTasks <= 0) return 0.0;
        return Math.Min(completedTasks / 50.0, 1.0);
    }

    public static double CalculateMatchingScore(double ratingScore, double experienceScore) =>
        ratingScore * RatingWeight + experienceScore * ExperienceWeight;

    // Hai khung giờ [existingStart, existingEnd) và [newStart, newEnd) có chồng lấn không
    public static bool HasScheduleConflict(DateTime existingStart, DateTime existingEnd, DateTime newStart, DateTime newEnd) =>
        existingStart < newEnd && existingEnd > newStart;
}
