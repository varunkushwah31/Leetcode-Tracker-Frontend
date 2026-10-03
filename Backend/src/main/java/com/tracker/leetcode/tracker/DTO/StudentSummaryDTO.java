package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSummaryDTO {
    private String id;
    private String name;
    private String leetcodeUsername;
    private String codeforcesHandle;
    private String rank;
    private double currentContestRating;
    private Integer codeforcesRating;
    private Integer codeforcesMaxRating;
    private String codeforcesRank;
    private int leetcodeSolvedCount;
    private int codeforcesSolvedCount;
    private int totalSolved; // Combined LeetCode + Codeforces
    private int consistencyStreak;
    private int completedAssignments;
    private int pendingAssignments;
    private String email;
    private String avatarUrl;
}