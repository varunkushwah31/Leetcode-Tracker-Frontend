package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "password_reset_otps")
public class PasswordResetOtp {

    @Id
    private String id;

    @Indexed
    private String email;

    private String otp;

    private String resetToken;

    @Builder.Default
    private boolean verified = false;

    @Builder.Default
    private int failedAttempts = 0;

    @Indexed(expireAfter = "0s")
    private Instant expiryDate;

    private Instant createdAt;
}
