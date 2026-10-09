package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.PasswordResetOtp;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PasswordResetOtpRepository extends MongoRepository<PasswordResetOtp, String> {
    Optional<PasswordResetOtp> findTopByEmailOrderByCreatedAtDesc(String email);
    Optional<PasswordResetOtp> findByEmailAndResetToken(String email, String resetToken);
    Optional<PasswordResetOtp> findByEmailAndOtp(String email, String otp);
    void deleteByEmail(String email);
}
