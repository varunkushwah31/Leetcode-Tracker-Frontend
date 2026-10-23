package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePvpMatchRequest {
    private String opponentId;
    private String problemTopic;      // e.g. "Dynamic Programming", "Tree", "Binary Search", "Any"
    private String problemDifficulty; // "Easy", "Medium", "Hard", "Any"
    private int durationMinutes;      // e.g. 15, 30, 45, 60
    private String customProblemTitle;
    private String customProblemSlug;
    private String customProblemLink;
}
