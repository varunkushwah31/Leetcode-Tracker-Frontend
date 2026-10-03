package com.tracker.leetcode.tracker.DTO;

import jakarta.validation.constraints.Size;

public record UpdateHandlesRequest(
        String leetcodeUsername,
        @Size(max = 50, message = "Codeforces handle must be under 50 characters")
        String codeforcesHandle
) {}
