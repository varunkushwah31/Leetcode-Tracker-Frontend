package com.tracker.leetcode.tracker.Mapper;

import com.tracker.leetcode.tracker.DTO.*;
import com.tracker.leetcode.tracker.Models.Assignment;
import com.tracker.leetcode.tracker.Models.DailyProgress;
import com.tracker.leetcode.tracker.Models.ProblemStats;
import com.tracker.leetcode.tracker.Models.RecentSubmission;
import com.tracker.leetcode.tracker.Models.Student;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class StudentMapper {

    // Use this when fetching a student globally (no classroom context)
    public StudentSummaryDTO toSummaryDTO(Student student) {
        return toSummaryDTO(student, null);
    }

    // Updated Method: Now accepts the list of assignments and checks multi-platform completions
    public StudentSummaryDTO toSummaryDTO(Student student, List<Assignment> classroomAssignments) {
        int completed = 0;
        int pending = 0;

        if (classroomAssignments != null && !classroomAssignments.isEmpty()) {
            for (Assignment assignment : classroomAssignments) {
                // 1. Check if they manually or automatically validated it first
                boolean isManuallyValidated = student.getManuallyCompletedAssignments() != null &&
                        student.getManuallyCompletedAssignments().contains(assignment.getId());

                // 2. Fallback: Check if the server caught it in their recent activity (LeetCode or Codeforces)
                boolean isCaughtByServer = false;
                if (!isManuallyValidated && student.getRecentSubmissions() != null) {
                    isCaughtByServer = student.getRecentSubmissions().stream()
                            .anyMatch(sub -> {
                                boolean platformMatch = assignment.getPlatform() == null || sub.getPlatform() == assignment.getPlatform();
                                boolean slugMatch = isProblemSlugMatch(sub.getTitleSlug(), assignment.getTitleSlug());
                                return platformMatch && slugMatch;
                            });
                }

                // If either is true, they get credit!
                if (isManuallyValidated || isCaughtByServer) {
                    completed++;
                } else {
                    pending++;
                }
            }
        }

        int leetcodeSolved = calculateLeetcodeSolved(student.getProblemStats());
        int codeforcesSolved = student.getCodeforcesSolvedCount() != null ? student.getCodeforcesSolvedCount() : 0;
        int combinedTotalSolved = leetcodeSolved + codeforcesSolved;

        return StudentSummaryDTO.builder()
                .id(student.getId())
                .name(student.getName())
                .email(student.getEmail())
                .leetcodeUsername(student.getLeetcodeUsername())
                .codeforcesHandle(student.getCodeforcesHandle())
                .rank(student.getRank() != null ? student.getRank() : "Unranked")
                .currentContestRating(student.getCurrentContestRating())
                .codeforcesRating(student.getCodeforcesRating())
                .codeforcesMaxRating(student.getCodeforcesMaxRating())
                .codeforcesRank(student.getCodeforcesRank())
                .leetcodeSolvedCount(leetcodeSolved)
                .codeforcesSolvedCount(codeforcesSolved)
                .totalSolved(combinedTotalSolved)
                .consistencyStreak(calculateStreak(student.getProgressHistory(), student.getStreak(), student.getRecentSubmissions()))
                .completedAssignments(completed)
                .pendingAssignments(pending)
                .avatarUrl(student.getAvatarUrl())
                .build();
    }

    public StudentProgressDTO toProgressDTO(Student student) {
        return StudentProgressDTO.builder()
                .leetcodeUsername(student.getLeetcodeUsername())
                .progressHistory(student.getProgressHistory())
                .build();
    }

    public StudentStatsDTO toStatsDTO(Student student) {
        return StudentStatsDTO.builder()
                .leetcodeUsername(student.getLeetcodeUsername())
                .problemStats(student.getProblemStats())
                .build();
    }

    public StudentRecentDTO toRecentDTO(Student student) {
        return StudentRecentDTO.builder()
                .leetcodeUsername(student.getLeetcodeUsername())
                .recentSubmissions(student.getRecentSubmissions())
                .build();
    }

    public StudentExtendedDTO toExtendedDTO(Student student) {
        int leetcodeSolved = calculateLeetcodeSolved(student.getProblemStats());
        int codeforcesSolved = student.getCodeforcesSolvedCount() != null ? student.getCodeforcesSolvedCount() : 0;
        int combinedTotalSolved = leetcodeSolved + codeforcesSolved;

        return StudentExtendedDTO.builder()
                .id(student.getId())
                .name(student.getName())
                .email(student.getEmail())
                .leetcodeUsername(student.getLeetcodeUsername())
                .codeforcesHandle(student.getCodeforcesHandle())
                .about(student.getAbout())
                .rank(student.getRank())
                .currentContestRating(student.getCurrentContestRating())
                .codeforcesRating(student.getCodeforcesRating())
                .codeforcesMaxRating(student.getCodeforcesMaxRating())
                .codeforcesRank(student.getCodeforcesRank())
                .codeforcesMaxRank(student.getCodeforcesMaxRank())
                .codeforcesAvatarUrl(student.getCodeforcesAvatarUrl())
                .leetcodeSolvedCount(leetcodeSolved)
                .codeforcesSolvedCount(codeforcesSolved)
                .totalSolved(combinedTotalSolved)
                .socialMedia(student.getSocialMedia())
                .badges(student.getBadges())
                .contestHistory(student.getContestHistory())
                .codeforcesContestHistory(student.getCodeforcesContestHistory())
                .consistencyStreak(calculateStreak(student.getProgressHistory(), student.getStreak(), student.getRecentSubmissions()))
                .skills(student.getSkills())
                .problemStats(student.getProblemStats())
                .recentSubmissions(student.getRecentSubmissions())
                .progressHistory(student.getProgressHistory())
                .avatarUrl(student.getAvatarUrl())
                .build();
    }

    // --- Helper Methods ---

    public int calculateLeetcodeSolved(List<ProblemStats> stats) {
        if (stats == null || stats.isEmpty()) return 0;
        return stats.stream()
                .filter(stat -> "All".equalsIgnoreCase(stat.getDifficulty()))
                .mapToInt(ProblemStats::getCount)
                .findFirst()
                .orElse(0);
    }

    public static String normalizeSlug(String slug) {
        if (slug == null || slug.isEmpty()) return "";
        StringBuilder sb = new StringBuilder(slug.length());
        for (int i = 0; i < slug.length(); i++) {
            char c = slug.charAt(i);
            if (Character.isLetterOrDigit(c)) {
                sb.append(Character.toLowerCase(c));
            }
        }
        return sb.toString();
    }

    public static boolean isProblemSlugMatch(String subSlug, String assignSlug) {
        if (subSlug == null || assignSlug == null) return false;
        if (subSlug.equalsIgnoreCase(assignSlug)) return true;
        return normalizeSlug(subSlug).equalsIgnoreCase(normalizeSlug(assignSlug));
    }

    public static final java.time.ZoneId IST_ZONE = java.time.ZoneId.of("Asia/Kolkata");

    public int calculateStreak(List<DailyProgress> history) {
        return calculateStreak(history, null, null);
    }

    public int calculateStreak(List<DailyProgress> history, Integer officialStreak) {
        return calculateStreak(history, officialStreak, null);
    }

    public int calculateStreak(List<DailyProgress> history, Integer officialStreak, List<RecentSubmission> recentSubmissions) {
        Set<LocalDate> activeDates = new HashSet<>();

        if (history != null) {
            for (DailyProgress dp : history) {
                if (dp != null && dp.getDate() != null && dp.getQuestionSolved() > 0) {
                    activeDates.add(dp.getDate());
                }
            }
        }

        if (recentSubmissions != null) {
            for (RecentSubmission sub : recentSubmissions) {
                if (sub != null && sub.getTimestamp() > 0) {
                    LocalDate d = Instant.ofEpochSecond(sub.getTimestamp()).atZone(IST_ZONE).toLocalDate();
                    activeDates.add(d);
                }
            }
        }

        if (activeDates.isEmpty()) {
            return 0;
        }

        LocalDate today = LocalDate.now(IST_ZONE);
        LocalDate yesterday = today.minusDays(1);

        boolean solvedToday = activeDates.contains(today);
        boolean solvedYesterday = activeDates.contains(yesterday);

        // A streak is CURRENTLY ACTIVE only if at least one problem was solved
        // today or yesterday in Indian Standard Time (Asia/Kolkata) across either platform.
        // If neither today nor yesterday has solves across both platforms, current streak is 0.
        if (!solvedToday && !solvedYesterday) {
            return 0;
        }

        // Active streak sequence starts from today (if solved today) or yesterday (if today is still underway)
        LocalDate checkDate = solvedToday ? today : yesterday;
        int combinedStreak = 0;

        while (activeDates.contains(checkDate)) {
            combinedStreak++;
            checkDate = checkDate.minusDays(1);
        }

        // Only preserve an official platform streak (e.g. LeetCode streak freeze preservation)
        // if the student's streak is active AND yesterday was solved.
        // If yesterday was NOT solved on either platform, the streak cannot exceed 1 day.
        int finalStreak = combinedStreak;
        if (officialStreak != null && officialStreak > 0 && solvedYesterday) {
            finalStreak = Math.max(combinedStreak, officialStreak);
        }

        return finalStreak;
    }
}