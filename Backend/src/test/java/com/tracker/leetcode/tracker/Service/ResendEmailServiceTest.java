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

    @Test
    @DisplayName("sendTestEmail in dev mode should return success map with DEV_CONSOLE provider")
    void sendTestEmail_DevMode_ShouldSucceed() {
        var result = emailService.sendTestEmail("test@example.com");
        assertNotNull(result);
        assertEquals("SUCCESS", result.get("status"));
        assertEquals("DEV_CONSOLE", result.get("provider"));
        assertFalse((Boolean) result.get("emailJsConfigured"));
    }

    @Test
    @DisplayName("sendTestEmail with blank email should throw ValidationFailedException")
    void sendTestEmail_BlankEmail_ShouldThrow() {
        assertThrows(ValidationFailedException.class, () ->
                emailService.sendTestEmail("")
        );
    }
}
