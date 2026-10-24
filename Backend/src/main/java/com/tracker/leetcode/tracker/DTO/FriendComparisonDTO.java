package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendComparisonDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private StudentExtendedDTO friendProfile;

    private List<String> mutualSolved;
    private List<String> friendOnlySolved;
    private List<String> userOnlySolved;

    private int userSolvedCount;
    private int friendSolvedCount;

    private double userRating;
    private double friendRating;

    private int userStreak;
    private int friendStreak;

    private int userPvpWinsAgainstFriend;
    private int friendPvpWinsAgainstUser;
    private int pvpDraws;
    private int userCScore;
    private int friendCScore;
}
