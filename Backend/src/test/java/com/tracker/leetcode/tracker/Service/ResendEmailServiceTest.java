package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.ValidationFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResendEmailServiceTest {

    private ResendEmailService emailService;

    @BeforeEach
    void setUp() {
        // Initialize with empty keys to test dev mode and HTML template generation safely
        emailService = new ResendEmailService("", "onboarding@resend.dev", "", null);
    }

    @Test
    @DisplayName("sendStudentRegistrationOtp should generate HTML template safely without format conversion errors")
    void sendStudentRegistrationOtp_ShouldSucceedWithoutException() {
        assertDoesNotThrow(() ->
                emailService.sendStudentRegistrationOtp("student@example.com", "123456", "Tourist")
        );
    }

    @Test
    @DisplayName("sendStudentRegistrationOtp with null userName should succeed safely")
    void sendStudentRegistrationOtp_WithNullUserName_ShouldSucceed() {
        assertDoesNotThrow(() ->
                emailService.sendStudentRegistrationOtp("student@example.com", "654321", null)
        );
    }

    @Test
    @DisplayName("sendOtpEmail should generate Password Reset HTML template safely without format conversion errors")
    void sendOtpEmail_ShouldSucceedWithoutException() {
        assertDoesNotThrow(() ->
                emailService.sendOtpEmail("user@example.com", "987654", "Tourist")
        );
    }

    @Test
    @DisplayName("sendNudgeEmail should generate Nudge HTML template safely without format conversion errors")
    void sendNudgeEmail_ShouldSucceedWithoutException() {
        assertDoesNotThrow(() ->
                emailService.sendNudgeEmail("student@example.com", "Tourist", "Two Sum", "CS101")
        );
    }

    @Test
    @DisplayName("sendStudentRegistrationOtp with blank email should throw ValidationFailedException")
    void sendStudentRegistrationOtp_BlankEmail_ShouldThrow() {
        assertThrows(ValidationFailedException.class, () ->
                emailService.sendStudentRegistrationOtp("", "123456", "Tourist")
        );
    }

    @Test
    @DisplayName("sendStudentRegistrationOtp with blank OTP should throw ValidationFailedException")
    void sendStudentRegistrationOtp_BlankOtp_ShouldThrow() {
        assertThrows(ValidationFailedException.class, () ->
                emailService.sendStudentRegistrationOtp("student@example.com", "", "Tourist")
        );
    }
}
