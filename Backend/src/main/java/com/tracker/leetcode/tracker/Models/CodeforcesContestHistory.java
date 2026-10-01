package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeforcesContestHistory {
    private int contestId;
    private String contestName;
    private int rank;
    private int oldRating;
    private int newRating;
    private long ratingUpdateTimeSeconds;
}
