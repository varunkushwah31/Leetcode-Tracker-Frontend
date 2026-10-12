package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingContestDTO {
    private String id;
    private String platform; // "LEETCODE" | "CODEFORCES"
    private String title;
    private long startTimeSeconds;
    private long durationSeconds;
    private String url;
    private String phase; // "BEFORE" (upcoming) | "CODING" (active / live)
}
