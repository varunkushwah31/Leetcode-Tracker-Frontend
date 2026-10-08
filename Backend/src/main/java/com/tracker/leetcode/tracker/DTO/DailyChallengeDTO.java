package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyChallengeDTO {
    private String date; // YYYY-MM-DD

    // LeetCode Problem of the Day
    private String leetcodeFrontendId;
    private String leetcodeTitle;
    private String leetcodeTitleSlug;
    private String leetcodeDifficulty;
    private String leetcodeUrl;
    private List<String> leetcodeTopicTags;

    // Codeforces Daily Pick
    private String codeforcesTitle;
    private Integer codeforcesContestId;
    private String codeforcesIndex;
    private Integer codeforcesRating;
    private String codeforcesUrl;
    private List<String> codeforcesTags;

    // Classroom Ticker & Student Completion
    private String classroomName;
    private int classroomTotalStudents;
    private int classroomSolvedCount;
    private double classroomSolvedPercentage;
    private boolean userSolvedLeetcode;
    private boolean userSolvedCodeforces;
    private boolean userSolved; // true if user completed either or both
}
