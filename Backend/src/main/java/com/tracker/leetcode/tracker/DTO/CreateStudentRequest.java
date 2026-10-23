package com.tracker.leetcode.tracker.DTO;

public record CreateStudentRequest(
        String name,
        String email,
        String leetcodeUsername,
        String codeforcesHandle
) {}
