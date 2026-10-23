package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id; // student ID
    private String friendshipId;
    private String name;
    private String email;
    private String leetcodeUsername;
    private String codeforcesHandle;
    private String avatarUrl;
    private double currentContestRating;
    private Integer codeforcesRating;
    private int leetcodeSolvedCount;
    private int codeforcesSolvedCount;
    private int totalSolved;
    private int streak;
    private int pvpWins;
    private int pvpLosses;
    private String status; // ACCEPTED, PENDING_INCOMING, PENDING_OUTGOING
    private Instant friendSince;
    private Instant lastActive;
    private boolean isOnline;
}
