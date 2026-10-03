package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "LearningPaths")
public class LearningPath {

    @Id
    private String id;

    // The mentor who created this path
    private String mentorId;

    // e.g., "Week 1: Arrays & Hashing"
    private String title;

    private String description;

    // The list of questions inside this path
    private List<PathQuestion> questions = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PathQuestion {
        private Platform platform; // LEETCODE or CODEFORCES (defaults to LEETCODE if null)
        private String title;      // Optional problem title
        private String titleSlug;  // e.g., "two-sum" or "4A"

        // Instead of a hard deadline, paths use relative days.
        // e.g., "Due 3 days after I assign this path to a class"
        private int daysToComplete;
    }
}