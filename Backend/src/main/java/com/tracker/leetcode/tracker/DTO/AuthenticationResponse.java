package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.Role;
import lombok.Builder;

@Builder
public record AuthenticationResponse(
        String accessToken,
        String userId,
        String mentorId,
        String name,
        String refreshToken,
        Role role
) {}