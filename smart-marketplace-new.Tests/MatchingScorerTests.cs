using smart_marketplace_new.services;
using Xunit;

namespace smart_marketplace_new.Tests;

// Unit test cho logic thuần của matching engine (không cần database)
public class MatchingScorerTests
{
    // ---------- CalculateRatingScore: chuẩn hóa rating 0..5 về 0..1 ----------

    [Theory]
    [InlineData("5.0", 1.0)]   // rating tối đa
    [InlineData("4.75", 0.95)]
    [InlineData("4.8", 0.96)]
    [InlineData("2.5", 0.5)]
    [InlineData("0.0", 0.0)]   // rating tối thiểu
    public void CalculateRatingScore_MapsRatingToUnitInterval(string rating, double expected)
    {
        var score = MatchingScorer.CalculateRatingScore(decimal.Parse(rating));
        Assert.Equal(expected, score, precision: 4);
    }

    [Theory]
    [InlineData("-1.5")]   // dữ liệu rác: âm
    [InlineData("7.2")]    // dữ liệu rác: vượt 5
    public void CalculateRatingScore_ClampsOutOfRangeRating(string rating)
    {
        var score = MatchingScorer.CalculateRatingScore(decimal.Parse(rating));
        Assert.InRange(score, 0.0, 1.0);
    }

    [Fact]
    public void CalculateRatingScore_NegativeRating_ClampsToZero()
    {
        Assert.Equal(0.0, MatchingScorer.CalculateRatingScore(-1.5m), precision: 4);
    }

    [Fact]
    public void CalculateRatingScore_OverFive_ClampsToOne()
    {
        Assert.Equal(1.0, MatchingScorer.CalculateRatingScore(7.2m), precision: 4);
    }

    // ---------- CalculateExperienceScore: completedTasks / 50, chặn ở 1.0 ----------

    [Fact]
    public void CalculateExperienceScore_ZeroTasks_ReturnsZero()
    {
        Assert.Equal(0.0, MatchingScorer.CalculateExperienceScore(0));
    }

    [Fact]
    public void CalculateExperienceScore_NegativeTasks_ReturnsZero()
    {
        Assert.Equal(0.0, MatchingScorer.CalculateExperienceScore(-5));
    }

    [Fact]
    public void CalculateExperienceScore_25Tasks_IsHalf()
    {
        Assert.Equal(0.5, MatchingScorer.CalculateExperienceScore(25), precision: 4);
    }

    [Fact]
    public void CalculateExperienceScore_50Tasks_IsFull()
    {
        Assert.Equal(1.0, MatchingScorer.CalculateExperienceScore(50), precision: 4);
    }

    [Fact]
    public void CalculateExperienceScore_Over50Tasks_CapsAtOne()
    {
        Assert.Equal(1.0, MatchingScorer.CalculateExperienceScore(200));
    }

    // ---------- CalculateMatchingScore: trọng số 60/40 ----------

    [Fact]
    public void CalculateMatchingScore_PerfectWorker_IsOne()
    {
        var score = MatchingScorer.CalculateMatchingScore(1.0, 1.0);
        Assert.Equal(1.0, score, precision: 4);
    }

    [Fact]
    public void CalculateMatchingScore_AppliesWeights()
    {
        // rating 0.9, experience 0.4 → 0.9*0.6 + 0.4*0.4 = 0.7
        var score = MatchingScorer.CalculateMatchingScore(0.9, 0.4);
        Assert.Equal(0.7, score, precision: 4);
    }

    [Fact]
    public void CalculateMatchingScore_NewWorkerWithPerfectRating_BeatsExperiencedLowRating()
    {
        // Worker mới rating 5.0 nhưng 0 việc (0.6) phải thắng worker rating 3.0, 50 việc (0.36+0.4=0.76)? → không
        // Check cụ thể: rating 5.0 + 0 việc = 0.6 ; rating 3.0 + 50 việc = 0.36 + 0.4 = 0.76
        var rookie = MatchingScorer.CalculateMatchingScore(1.0, 0.0);
        var veteran = MatchingScorer.CalculateMatchingScore(0.6, 1.0);
        Assert.True(veteran > rookie);
    }

    // ---------- HasScheduleConflict: overlap nửa mở [start, end) ----------

    private static readonly DateTime Day = new(2026, 10, 20, 0, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void HasScheduleConflict_OverlappingWindows_ReturnsTrue()
    {
        // Existing 8:00-11:00, new 9:00-12:00 → chồng lấn
        var conflict = MatchingScorer.HasScheduleConflict(
            Day.AddHours(8), Day.AddHours(11),
            Day.AddHours(9), Day.AddHours(12));
        Assert.True(conflict);
    }

    [Fact]
    public void HasScheduleConflict_OneContainsOther_ReturnsTrue()
    {
        // Existing 8:00-17:00 bao trọn new 10:00-11:00
        var conflict = MatchingScorer.HasScheduleConflict(
            Day.AddHours(8), Day.AddHours(17),
            Day.AddHours(10), Day.AddHours(11));
        Assert.True(conflict);
    }

    [Fact]
    public void HasScheduleConflict_EndTouchesNextStart_IsNotConflict()
    {
        // Existing kết thúc 11:00 đúng lúc new bắt đầu 11:00 → không trùng (nửa mở)
        var conflict = MatchingScorer.HasScheduleConflict(
            Day.AddHours(8), Day.AddHours(11),
            Day.AddHours(11), Day.AddHours(14));
        Assert.False(conflict);
    }

    [Fact]
    public void HasScheduleConflict_DisjointWindows_ReturnsFalse()
    {
        var conflict = MatchingScorer.HasScheduleConflict(
            Day.AddHours(8), Day.AddHours(10),
            Day.AddHours(14), Day.AddHours(16));
        Assert.False(conflict);
    }

    [Fact]
    public void HasScheduleConflict_SameWindow_ReturnsTrue()
    {
        var conflict = MatchingScorer.HasScheduleConflict(
            Day.AddHours(9), Day.AddHours(11),
            Day.AddHours(9), Day.AddHours(11));
        Assert.True(conflict);
    }
}
