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
public class LeaderboardEntryDTO implements Serializable {
    private long rank;
    private String studentId;
    private String name;
    private String leetcodeUsername;
    private String codeforcesHandle;
    private String avatarUrl;
    private double score;
    private String metric;
}
