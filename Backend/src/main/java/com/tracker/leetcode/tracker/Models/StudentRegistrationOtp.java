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
@Document(collection = "student_registration_otps")
public class StudentRegistrationOtp {

    @Id
    private String id;

    @Indexed
    private String email;

    private String otp;

    @Builder.Default
    private int failedAttempts = 0;

    @Indexed(expireAfter = "0s")
    private Instant expiryDate;

    private Instant createdAt;
}
