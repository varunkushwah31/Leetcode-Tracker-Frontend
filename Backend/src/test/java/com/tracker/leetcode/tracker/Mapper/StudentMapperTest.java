package com.tracker.leetcode.tracker.Mapper;

import com.tracker.leetcode.tracker.Models.DailyProgress;
import com.tracker.leetcode.tracker.Models.Platform;
import com.tracker.leetcode.tracker.Models.RecentSubmission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StudentMapperTest {

    private StudentMapper studentMapper;
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @BeforeEach
    void setUp() {
        studentMapper = new StudentMapper();
    }

    @Test
    @DisplayName("Streak is 0 when history and submissions are empty or null")
    void testEmptyHistoryAndSubmissions() {
        assertEquals(0, studentMapper.calculateStreak(null, null));
        assertEquals(0, studentMapper.calculateStreak(new ArrayList<>(), new ArrayList<>()));
    }

    @Test
    @DisplayName("Streak is 0 when student did not solve problems today or yesterday")
    void testInactiveStreakIsZero() {
        LocalDate today = LocalDate.now(IST);
        List<DailyProgress> history = new ArrayList<>();
        // Solved 5 consecutive days, ending 2 days ago
        for (int i = 2; i <= 6; i++) {
            history.add(new DailyProgress(today.minusDays(i), 3));
        }

        int streak = studentMapper.calculateStreak(history, null);
        assertEquals(0, streak, "Streak should be 0 when inactive today and yesterday");
    }

    @Test
    @DisplayName("Streak counts correctly when student solved today and yesterday across both platforms")
    void testCombinedMultiPlatformStreak() {
        LocalDate today = LocalDate.now(IST);
        List<DailyProgress> history = new ArrayList<>();
        // Solved on LeetCode today and 2 days ago
        history.add(new DailyProgress(today, 2));
        history.add(new DailyProgress(today.minusDays(2), 1));

        // Solved on Codeforces yesterday via recent submission
        long yesterdayEpoch = today.minusDays(1).atStartOfDay(IST).toEpochSecond() + 3600; // 1 AM IST
        List<RecentSubmission> submissions = List.of(
                new RecentSubmission(
                        "Watermelon",
                        "4A",
                        yesterdayEpoch,
                        Platform.CODEFORCES,
                        "https://codeforces.com/problemset/problem/4/A"
                )
        );

        int streak = studentMapper.calculateStreak(history, submissions);
        assertEquals(3, streak, "Streak should combine LeetCode and Codeforces activity across today, yesterday, and 2 days ago");
    }

    @Test
    @DisplayName("Streak counts from yesterday if student has not solved yet today")
    void testStreakActiveFromYesterday() {
        LocalDate today = LocalDate.now(IST);
        List<DailyProgress> history = new ArrayList<>();
        // Solved yesterday, 2 days ago, 3 days ago (today not yet solved)
        history.add(new DailyProgress(today.minusDays(1), 1));
        history.add(new DailyProgress(today.minusDays(2), 2));
        history.add(new DailyProgress(today.minusDays(3), 1));

        int streak = studentMapper.calculateStreak(history, null);
        assertEquals(3, streak, "Streak should be 3 when solved yesterday, 2d ago, 3d ago and today is pending");
    }

    @Test
    @DisplayName("Current streak is computed instead of historical max streak (Varun Kushwah scenario)")
    void testCurrentStreakNotOverriddenByMaxStreak() {
        LocalDate today = LocalDate.now(IST);
        List<DailyProgress> history = new ArrayList<>();

        // 20 consecutive active days ending today
        for (int i = 0; i < 20; i++) {
            history.add(new DailyProgress(today.minusDays(i), 2));
        }
        // Day 20 days ago (21st day back) was a gap (0 solves)
        // Before the gap, student had 123 more consecutive days (making historical max streak 143)
        for (int i = 21; i < 145; i++) {
            history.add(new DailyProgress(today.minusDays(i), 1));
        }

        // Even if old LeetCode max streak (143) is passed into the compatibility method, current streak must be 20
        int streak = studentMapper.calculateStreak(history, 143, null);
        assertEquals(20, streak, "Current streak should be 20 days, not historical max streak 143");
    }
}
