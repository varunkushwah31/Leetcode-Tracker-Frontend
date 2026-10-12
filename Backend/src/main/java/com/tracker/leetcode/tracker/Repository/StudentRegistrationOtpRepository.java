package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.StudentRegistrationOtp;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface StudentRegistrationOtpRepository extends MongoRepository<StudentRegistrationOtp, String> {
    Optional<StudentRegistrationOtp> findTopByEmailOrderByCreatedAtDesc(String email);
    Optional<StudentRegistrationOtp> findByEmailAndOtp(String email, String otp);
    void deleteByEmail(String email);
}
