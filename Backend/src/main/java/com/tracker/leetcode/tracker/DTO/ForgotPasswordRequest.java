package com.tracker.leetcode.tracker.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "Email address is required")
        @Email(message = "Please provide a valid email address")
        String email
) {}
