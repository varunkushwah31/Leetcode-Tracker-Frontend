package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.SkillStat;
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
public class ClassroomAnalyticsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String classroomId;
    private String className;
    private int totalStudents;

    // Averages across solved problems
    private int averageTotalSolved;
    private int averageEasy;
    private int averageMedium;
    private int averageHard;

    // Engagement & Activity
    private int activeStudentsThisWeek;
    private double classEngagementScore; // Percentage 0-100

    // Legacy Topic Analysis (kept for backwards compatibility)
    @Builder.Default
    private List<SkillStat> topStrengths = new ArrayList<>();
    @Builder.Default
    private List<SkillStat> criticalWeaknesses = new ArrayList<>();

    // Enhanced Topic Analysis with actionable problem recommendations
    @Builder.Default
    private List<TopicProficiencyDTO> topicProficiencies = new ArrayList<>();
    @Builder.Default
    private List<CuratedProblemDTO> recommendedActionItems = new ArrayList<>();

    // At-Risk & Inactivity Watchlist
    private int atRiskStudentsCount;
    @Builder.Default
    private List<AtRiskStudentDTO> atRiskStudents = new ArrayList<>();

    // Consistency & Streaks
    private double averageStreak;
    private String streakChampion;
    private int streakChampionStreak;

    // Assignment Completion Health
    private int totalAssignments;
    private double assignmentCompletionRate; // Percentage 0-100
    @Builder.Default
    private List<AssignmentAnalyticsDTO> assignmentsBreakdown = new ArrayList<>();

    // Difficulty Distribution & Interview Readiness
    private double easyPercentage;
    private double mediumPercentage;
    private double hardPercentage;
    private int interviewReadinessScore; // 0-100
    private String readinessAssessment;

    // Platform Diversity & Performance
    private int dualPlatformStudents;
    private int leetcodeOnlyStudents;
    private int codeforcesOnlyStudents;
    private double averageLeetcodeRating;
    private double averageCodeforcesRating;
}