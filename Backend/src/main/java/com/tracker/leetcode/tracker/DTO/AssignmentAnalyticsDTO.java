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
public class AssignmentAnalyticsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String assignmentId;
    private String title;
    private String titleSlug;
    private String platform;
    private String questionLink;
    private int completedStudentsCount;
    private int totalStudentsCount;
    private double completionPercentage;
    private long startTimestamp;
    private long endTimestamp;
    private boolean expired;
}
