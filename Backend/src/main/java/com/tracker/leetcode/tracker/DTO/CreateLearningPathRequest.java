package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.LearningPath;

import java.util.List;

public record CreateLearningPathRequest(
        String mentorId,
        String title,
        String description,
        List<LearningPath.PathQuestion> questions
) {}
