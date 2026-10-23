package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendsLeaderboardEntryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private int rank;
    private String studentId;
    private String name;
    private String leetcodeUsername;
    private String codeforcesHandle;
    private String avatarUrl;

    private int totalSolved;
    private int leetcodeSolved;
    private int codeforcesSolved;

    private double currentContestRating;
    private Integer codeforcesRating;

    private int streak;
    private int pvpWins;
    private int pvpLosses;
    private double pvpWinRate;

    private boolean isCurrentUser;
}
