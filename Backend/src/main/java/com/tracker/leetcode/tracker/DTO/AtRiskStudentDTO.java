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
public class AtRiskStudentDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String studentId;
    private String name;
    private String email;
    private String leetcodeUsername;
    private String codeforcesHandle;
    private int totalSolved;
    private int streak;
    private boolean activeThisWeek;
    private String riskLevel;   // "HIGH", "MEDIUM"
    private String riskReason;  // e.g. "Inactive for 7+ days", "Solve count is below 50% of class average"
}
