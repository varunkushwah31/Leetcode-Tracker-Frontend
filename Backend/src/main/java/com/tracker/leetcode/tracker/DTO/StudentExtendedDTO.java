package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExtendedDTO {
    private String id;
    private String name;
    private String email;
    private String leetcodeUsername;
    private String codeforcesHandle;
    private String about;
    private String rank;
    private double currentContestRating;
    private Integer codeforcesRating;
    private Integer codeforcesMaxRating;
    private String codeforcesRank;
    private String codeforcesMaxRank;
    private String codeforcesAvatarUrl;
    private int leetcodeSolvedCount;
    private int codeforcesSolvedCount;
    private int totalSolved; // Combined LeetCode + Codeforces
    private int consistencyStreak; // Combined streak
    private String avatarUrl;

    private SocialMedia socialMedia;
    private List<Badge> badges;
    private List<ContestHistory> contestHistory;
    private List<CodeforcesContestHistory> codeforcesContestHistory;
    private List<ProblemStats> problemStats;
    private List<RecentSubmission> recentSubmissions;
    private List<DailyProgress> progressHistory;
    private List<String> manuallyCompletedAssignments;
    private List<Classroom> classrooms;
    private List<SkillStat> skills;
}