package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicProficiencyDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String tagName;
    private int problemsSolved;
    private double averageSolved;
    private String masteryLevel;  // "STRONG", "DEVELOPING", "CRITICAL_WEAKNESS"
    private String severity;      // "HIGH", "MEDIUM", "LOW"
    private String recommendation;

    @Builder.Default
    private List<CuratedProblemDTO> suggestedProblems = new ArrayList<>();
}
