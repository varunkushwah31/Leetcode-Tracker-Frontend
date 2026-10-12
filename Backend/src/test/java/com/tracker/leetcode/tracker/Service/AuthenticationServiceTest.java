package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.AuthenticationResponse;
import com.tracker.leetcode.tracker.DTO.ChangePasswordRequest;
import com.tracker.leetcode.tracker.DTO.StudentRegisterRequest;
import com.tracker.leetcode.tracker.Exception.DuplicateStudentException;
import com.tracker.leetcode.tracker.Exception.UserAuthenticationException;
import com.tracker.leetcode.tracker.Exception.ValidationFailedException;
import com.tracker.leetcode.tracker.Models.AuthProvider;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.DTO.ForgotPasswordRequest;
import com.tracker.leetcode.tracker.DTO.ResetPasswordRequest;
import com.tracker.leetcode.tracker.DTO.SendStudentOtpRequest;
import com.tracker.leetcode.tracker.DTO.VerifyOtpRequest;
import com.tracker.leetcode.tracker.DTO.VerifyOtpResponse;
import com.tracker.leetcode.tracker.Models.PasswordResetOtp;
import com.tracker.leetcode.tracker.Models.StudentRegistrationOtp;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.PasswordResetOtpRepository;
import com.tracker.leetcode.tracker.Repository.StudentRegistrationOtpRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private StudentService studentService;

    @Mock
    private PasswordResetOtpRepository passwordResetOtpRepository;

    @Mock
    private StudentRegistrationOtpRepository studentRegistrationOtpRepository;

    @Mock
    private ResendEmailService resendEmailService;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        lenient().when(jwtService.generateToken(any())).thenReturn("mock-jwt-token");

        com.tracker.leetcode.tracker.Models.RefreshToken mockToken = new com.tracker.leetcode.tracker.Models.RefreshToken();
        mockToken.setToken("mock-refresh-token");
        lenient().when(refreshTokenService.createRefreshToken(any())).thenReturn(mockToken);
        lenient().when(studentService.syncAllProfileData(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void registerStudent_WithLeetCodeOnly_ShouldSucceed() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Alice", "alice@example.com", "pass123", "alice_lc", null
        );

        when(studentRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("alice_lc")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId("s1");
            return s;
        });

        AuthenticationResponse response = authenticationService.registerStudent(req);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.accessToken());
        assertEquals(Role.STUDENT, response.role());
        verify(studentRepository).save(argThat(s ->
                "alice_lc".equals(s.getLeetcodeUsername()) && s.getCodeforcesHandle() == null
        ));
        verify(studentService).syncAllProfileData(argThat((Student s) ->
                "alice_lc".equals(s.getLeetcodeUsername())
        ));
    }

    @Test
    void registerStudent_WithCodeforcesOnly_ShouldSucceed() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Bob", "bob@example.com", "pass123", null, "tourist"
        );

        when(studentRepository.findByEmail("bob@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("bob@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("tourist")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId("s2");
            return s;
        });

        AuthenticationResponse response = authenticationService.registerStudent(req);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.accessToken());
        assertEquals(Role.STUDENT, response.role());
        verify(studentRepository).save(argThat(s ->
                s.getLeetcodeUsername() == null && "tourist".equals(s.getCodeforcesHandle())
        ));
    }

    @Test
    void registerStudent_WithBothPlatforms_ShouldSucceed() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Charlie", "charlie@example.com", "pass123", "charlie_lc", "charlie_cf"
        );

        when(studentRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("charlie_lc")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("charlie_cf")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId("s3");
            return s;
        });

        AuthenticationResponse response = authenticationService.registerStudent(req);

        assertNotNull(response);
        verify(studentRepository).save(argThat(s ->
                "charlie_lc".equals(s.getLeetcodeUsername()) && "charlie_cf".equals(s.getCodeforcesHandle())
        ));
    }

    @Test
    void registerStudent_WithNeitherPlatform_ShouldThrowIllegalArgumentException() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Dave", "dave@example.com", "pass123", "   ", ""
        );

        when(studentRepository.findByEmail("dave@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("dave@example.com")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertTrue(ex.getMessage().contains("at least one platform username"));
        verify(studentRepository, never()).save(any());
    }

    @Test
    void registerStudent_WithDuplicateLeetcode_ShouldThrowDuplicateStudentException() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Eve", "eve@example.com", "pass123", "existing_lc", null
        );

        when(studentRepository.findByEmail("eve@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("eve@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("existing_lc")).thenReturn(Optional.of(new Student()));

        DuplicateStudentException ex = assertThrows(
                DuplicateStudentException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertTrue(ex.getMessage().contains("already in use"));
        verify(studentRepository, never()).save(any());
    }

    @Test
    void registerStudent_WithDuplicateCodeforces_ShouldThrowDuplicateStudentException() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Frank", "frank@example.com", "pass123", null, "existing_cf"
        );

        when(studentRepository.findByEmail("frank@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("frank@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("existing_cf")).thenReturn(Optional.of(new Student()));

        DuplicateStudentException ex = assertThrows(
                DuplicateStudentException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertTrue(ex.getMessage().contains("already in use"));
        verify(studentRepository, never()).save(any());
    }

    @Test
    void changePassword_ForStudent_WithValidCredentials_ShouldSucceed() {
        Student student = new Student();
        student.setEmail("student@example.com");
        student.setPassword("encodedOldPassword");

        when(studentRepository.findByEmail("student@example.com")).thenReturn(Optional.of(student));
        when(passwordEncoder.matches("oldPass123", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.matches("newPass456", "encodedOldPassword")).thenReturn(false);
        when(passwordEncoder.encode("newPass456")).thenReturn("encodedNewPassword");

        ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "newPass456", "newPass456");
        authenticationService.changePassword("student@example.com", request);

        assertEquals("encodedNewPassword", student.getPassword());
        verify(studentRepository).save(student);
    }

    @Test
    void changePassword_ForMentor_WithValidCredentials_ShouldSucceed() {
        Mentor mentor = new Mentor();
        mentor.setEmail("mentor@example.com");
        mentor.setPassword("encodedOldPassword");

        when(studentRepository.findByEmail("mentor@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("mentor@example.com")).thenReturn(Optional.of(mentor));
        when(passwordEncoder.matches("oldPass123", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.matches("newPass456", "encodedOldPassword")).thenReturn(false);
        when(passwordEncoder.encode("newPass456")).thenReturn("encodedNewPassword");

        ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "newPass456", "newPass456");
        authenticationService.changePassword("mentor@example.com", request);

        assertEquals("encodedNewPassword", mentor.getPassword());
        verify(mentorRepository).save(mentor);
    }

    @Test
    void changePassword_WithIncorrectCurrentPassword_ShouldThrowValidationFailedException() {
        Student student = new Student();
        student.setEmail("student@example.com");
        student.setPassword("encodedOldPassword");

        when(studentRepository.findByEmail("student@example.com")).thenReturn(Optional.of(student));
        when(passwordEncoder.matches("wrongPass", "encodedOldPassword")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest("wrongPass", "newPass456", "newPass456");
        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.changePassword("student@example.com", request)
        );

        assertEquals("Current password is incorrect.", ex.getMessage());
        verify(studentRepository, never()).save(any());
    }

    @Test
    void changePassword_WithSameNewPassword_ShouldThrowValidationFailedException() {
        Student student = new Student();
        student.setEmail("student@example.com");
        student.setPassword("encodedOldPassword");

        when(studentRepository.findByEmail("student@example.com")).thenReturn(Optional.of(student));
        when(passwordEncoder.matches("samePassword", "encodedOldPassword")).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest("samePassword", "samePassword", "samePassword");
        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.changePassword("student@example.com", request)
        );

        assertEquals("New password cannot be the same as your current password.", ex.getMessage());
        verify(studentRepository, never()).save(any());
    }

    @Test
    void changePassword_WithMismatchedConfirmPassword_ShouldThrowValidationFailedException() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "newPass456", "differentPass");

        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.changePassword("student@example.com", request)
        );

        assertEquals("New password and confirmation password do not match.", ex.getMessage());
    }

    @Test
    void changePassword_WithShortPassword_ShouldThrowValidationFailedException() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "short", "short");

        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.changePassword("student@example.com", request)
        );

        assertEquals("New password must be at least 6 characters long.", ex.getMessage());
    }

    // ==================== FORGOT & RESET PASSWORD OTP TESTS ====================

    @Test
    void sendPasswordResetOtp_WithValidStudentEmail_ShouldDispatchEmail() {
        Student student = new Student();
        student.setEmail("student@example.com");
        student.setName("Alice");

        when(studentRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.of(student));

        Map<String, String> response = authenticationService.sendPasswordResetOtp(new ForgotPasswordRequest("student@example.com"));

        assertNotNull(response);
        assertTrue(response.get("message").contains("verification code"));
        verify(passwordResetOtpRepository).deleteByEmail("student@example.com");
        verify(passwordResetOtpRepository).save(any(PasswordResetOtp.class));
        verify(resendEmailService).sendOtpEmail(eq("student@example.com"), anyString(), eq("Alice"));
    }

    @Test
    void sendPasswordResetOtp_WithNonExistentEmail_ShouldThrowValidationFailedException() {
        when(studentRepository.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.sendPasswordResetOtp(new ForgotPasswordRequest("ghost@example.com"))
        );
        verify(resendEmailService, never()).sendOtpEmail(any(), any(), any());
    }

    @Test
    void verifyPasswordResetOtp_WithValidOtp_ShouldReturnResetToken() {
        PasswordResetOtp record = PasswordResetOtp.builder()
                .email("student@example.com")
                .otp("123456")
                .expiryDate(Instant.now().plus(Duration.ofMinutes(5)))
                .build();

        when(passwordResetOtpRepository.findTopByEmailOrderByCreatedAtDesc("student@example.com")).thenReturn(Optional.of(record));

        VerifyOtpResponse response = authenticationService.verifyPasswordResetOtp(new VerifyOtpRequest("student@example.com", "123456"));

        assertNotNull(response);
        assertNotNull(response.resetToken());
        assertTrue(record.isVerified());
        verify(passwordResetOtpRepository).save(record);
    }

    @Test
    void verifyPasswordResetOtp_WithIncorrectOtp_ShouldThrowValidationFailedException() {
        PasswordResetOtp record = PasswordResetOtp.builder()
                .email("student@example.com")
                .otp("123456")
                .expiryDate(Instant.now().plus(Duration.ofMinutes(5)))
                .build();

        when(passwordResetOtpRepository.findTopByEmailOrderByCreatedAtDesc("student@example.com")).thenReturn(Optional.of(record));

        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.verifyPasswordResetOtp(new VerifyOtpRequest("student@example.com", "999999"))
        );

        assertTrue(ex.getMessage().contains("Invalid verification code"));
    }

    @Test
    void resetPasswordWithOtp_WithValidResetToken_ShouldUpdatePassword() {
        PasswordResetOtp record = PasswordResetOtp.builder()
                .email("student@example.com")
                .resetToken("token-123")
                .verified(true)
                .expiryDate(Instant.now().plus(Duration.ofMinutes(5)))
                .build();

        Student student = new Student();
        student.setId("s1");
        student.setEmail("student@example.com");

        when(passwordResetOtpRepository.findByEmailAndResetToken("student@example.com", "token-123")).thenReturn(Optional.of(record));
        when(studentRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.of(student));
        when(passwordEncoder.encode("brandNewPass123")).thenReturn("encodedNewPass");

        ResetPasswordRequest request = new ResetPasswordRequest(
                "student@example.com",
                "token-123",
                null,
                "brandNewPass123",
                "brandNewPass123"
        );

        Map<String, String> response = authenticationService.resetPasswordWithOtp(request);

        assertNotNull(response);
        assertEquals("encodedNewPass", student.getPassword());
        verify(studentRepository).save(student);
        verify(passwordResetOtpRepository).delete(record);
        verify(refreshTokenService).deleteByMentorId("s1");
    }

    // ==================== STUDENT REGISTRATION OTP TESTS ====================

    @Test
    void sendStudentRegistrationOtp_WithNewEmail_ShouldDispatchEmail() {
        when(studentRepository.findByEmailIgnoreCase("newstudent@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByEmail("newstudent@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmailIgnoreCase("newstudent@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("newstudent@example.com")).thenReturn(Optional.empty());

        SendStudentOtpRequest req = new SendStudentOtpRequest("newstudent@example.com", "New Student");
        Map<String, String> response = authenticationService.sendStudentRegistrationOtp(req);

        assertNotNull(response);
        verify(studentRegistrationOtpRepository).deleteByEmail("newstudent@example.com");
        verify(studentRegistrationOtpRepository).save(any(StudentRegistrationOtp.class));
        verify(resendEmailService).sendStudentRegistrationOtp(eq("newstudent@example.com"), anyString(), eq("New Student"));
    }

    @Test
    void sendStudentRegistrationOtp_WithExistingEmail_ShouldThrowDuplicateStudentException() {
        Student existing = new Student();
        existing.setEmail("existing@example.com");
        when(studentRepository.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.of(existing));

        SendStudentOtpRequest req = new SendStudentOtpRequest("existing@example.com", "Existing");
        assertThrows(
                DuplicateStudentException.class,
                () -> authenticationService.sendStudentRegistrationOtp(req)
        );

        verify(studentRegistrationOtpRepository, never()).save(any());
        verify(resendEmailService, never()).sendStudentRegistrationOtp(any(), any(), any());
    }

    @Test
    void registerStudent_WithValidOtp_ShouldCreateStudent() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Charlie", "charlie@example.com", "pass123", "charlie_lc", null, "654321"
        );

        StudentRegistrationOtp otpRecord = StudentRegistrationOtp.builder()
                .email("charlie@example.com")
                .otp("654321")
                .expiryDate(Instant.now().plus(Duration.ofMinutes(5)))
                .build();

        when(studentRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByEmailIgnoreCase("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmailIgnoreCase("charlie@example.com")).thenReturn(Optional.empty());
        when(studentRegistrationOtpRepository.findTopByEmailOrderByCreatedAtDesc("charlie@example.com")).thenReturn(Optional.of(otpRecord));
        when(studentRepository.findByLeetcodeUsername("charlie_lc")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId("s3");
            return s;
        });

        AuthenticationResponse response = authenticationService.registerStudent(req);

        assertNotNull(response);
        assertEquals(Role.STUDENT, response.role());
        verify(studentRegistrationOtpRepository).delete(otpRecord);
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    void registerStudent_WithInvalidOtp_ShouldThrowValidationFailedException() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Charlie", "charlie@example.com", "pass123", "charlie_lc", null, "000000"
        );

        StudentRegistrationOtp otpRecord = StudentRegistrationOtp.builder()
                .email("charlie@example.com")
                .otp("654321")
                .expiryDate(Instant.now().plus(Duration.ofMinutes(5)))
                .build();

        when(studentRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByEmailIgnoreCase("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmailIgnoreCase("charlie@example.com")).thenReturn(Optional.empty());
        when(studentRegistrationOtpRepository.findTopByEmailOrderByCreatedAtDesc("charlie@example.com")).thenReturn(Optional.of(otpRecord));

        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertTrue(ex.getMessage().contains("Invalid verification code"));
        verify(studentRepository, never()).save(any());
    }

    @Test
    void registerStudent_WhenVerificationRequiredAndNoOtp_ShouldThrowValidationFailedException() {
        authenticationService.setRequireStudentEmailVerification(true);
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Charlie", "charlie@example.com", "pass123", "charlie_lc", null, null
        );

        when(studentRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByEmailIgnoreCase("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmailIgnoreCase("charlie@example.com")).thenReturn(Optional.empty());

        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertEquals("Email verification code is required.", ex.getMessage());
        verify(studentRepository, never()).save(any());
    }

    @Test
    void sendStudentRegistrationOtp_WhenWithinCooldown_ShouldThrowValidationFailedException() {
        StudentRegistrationOtp recent = StudentRegistrationOtp.builder()
                .email("student@example.com")
                .createdAt(Instant.now().minus(Duration.ofSeconds(20)))
                .build();

        when(studentRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByEmail("student@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("student@example.com")).thenReturn(Optional.empty());
        when(studentRegistrationOtpRepository.findTopByEmailOrderByCreatedAtDesc("student@example.com")).thenReturn(Optional.of(recent));

        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.sendStudentRegistrationOtp(new SendStudentOtpRequest("student@example.com", "Student"))
        );

        assertTrue(ex.getMessage().contains("Please wait"));
        verify(resendEmailService, never()).sendStudentRegistrationOtp(any(), any(), any());
    }

    @Test
    void verifyPasswordResetOtp_WhenFiveAttemptsExceeded_ShouldInvalidateAndThrow() {
        PasswordResetOtp record = PasswordResetOtp.builder()
                .email("student@example.com")
                .otp("123456")
                .failedAttempts(4)
                .expiryDate(Instant.now().plus(Duration.ofMinutes(5)))
                .build();

        when(passwordResetOtpRepository.findTopByEmailOrderByCreatedAtDesc("student@example.com")).thenReturn(Optional.of(record));

        ValidationFailedException ex = assertThrows(
                ValidationFailedException.class,
                () -> authenticationService.verifyPasswordResetOtp(new VerifyOtpRequest("student@example.com", "999999"))
        );

        assertTrue(ex.getMessage().contains("Too many incorrect attempts"));
        verify(passwordResetOtpRepository).delete(record);
    }
}
