package com.tracker.leetcode.tracker.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Email address is required")
        @Email(message = "Please provide a valid email address")
        String email,

        String resetToken,

        String otp,

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "New password must be at least 6 characters")
        String newPassword,

        String confirmPassword
) {}
