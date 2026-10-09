package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.AuthenticationRequest;
import com.tracker.leetcode.tracker.DTO.AuthenticationResponse;
import com.tracker.leetcode.tracker.DTO.ChangePasswordRequest;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.DTO.StudentRegisterRequest;
import com.tracker.leetcode.tracker.DTO.ForgotPasswordRequest;
import com.tracker.leetcode.tracker.DTO.ResetPasswordRequest;
import com.tracker.leetcode.tracker.DTO.SendStudentOtpRequest;
import com.tracker.leetcode.tracker.DTO.VerifyOtpRequest;
import com.tracker.leetcode.tracker.DTO.VerifyOtpResponse;
import com.tracker.leetcode.tracker.Exception.DuplicateMentorException;
import com.tracker.leetcode.tracker.Exception.DuplicateStudentException;
import com.tracker.leetcode.tracker.Exception.UserAuthenticationException;
import com.tracker.leetcode.tracker.Exception.ValidationFailedException;
import com.tracker.leetcode.tracker.Models.*;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.PasswordResetOtpRepository;
import com.tracker.leetcode.tracker.Repository.StudentRegistrationOtpRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthenticationService {

    private final StudentRepository studentRepository;
    private final MentorRepository mentorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final StudentService studentService;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final StudentRegistrationOtpRepository studentRegistrationOtpRepository;
    private final ResendEmailService resendEmailService;

    @Value("${application.auth.student-email-verification:true}")
    private boolean requireStudentEmailVerification = false;

    public void setRequireStudentEmailVerification(boolean requireStudentEmailVerification) {
        this.requireStudentEmailVerification = requireStudentEmailVerification;
    }

    // 1. REGISTRATION LOGIC

    public AuthenticationResponse register(RegisterRequest request){
        log.info("Registering new Mentor with email: {}", request.email());
        if (mentorRepository.findByEmail(request.email()).isPresent() || studentRepository.findByEmail(request.email()).isPresent()){
            throw new DuplicateMentorException("Email already in use.");
        }
        Mentor mentor = new Mentor();
        mentor.setName(request.name());
        mentor.setEmail(request.email());
        mentor.setPassword(passwordEncoder.encode(request.password()));
        mentor.setRole(Role.MENTOR);
        mentor.setProvider(AuthProvider.LOCAL);
        mentor.setEnabled(true);

        Mentor savedMentor = mentorRepository.save(mentor);
        return generateAuthResponseForMentor(savedMentor);
    }

    public AuthenticationResponse registerStudent(StudentRegisterRequest request){
        log.info("Registering new student: {}", request.email());
        String normalizedEmail = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (studentRepository.findByEmail(request.email()).isPresent() ||
            studentRepository.findByEmailIgnoreCase(normalizedEmail).isPresent() ||
            mentorRepository.findByEmail(request.email()).isPresent() ||
            mentorRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()){
            throw new DuplicateStudentException("Student email already in use.");
        }

        // Email OTP Verification for student registration
        if (studentRegistrationOtpRepository != null && (requireStudentEmailVerification || (request.otp() != null && !request.otp().isBlank()))) {
            if (request.otp() == null || request.otp().isBlank()) {
                throw new ValidationFailedException("Email verification code is required.");
            }
            String submittedOtp = request.otp().trim();
            var otpRecordOpt = studentRegistrationOtpRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);
            if (otpRecordOpt.isEmpty()) {
                throw new ValidationFailedException("No pending verification found for this email. Please request a verification code.");
            }
            StudentRegistrationOtp record = otpRecordOpt.get();
            if (record.getExpiryDate().isBefore(Instant.now())) {
                studentRegistrationOtpRepository.delete(record);
                throw new ValidationFailedException("Verification code has expired. Please request a new one.");
            }
            if (!record.getOtp().equals(submittedOtp)) {
                throw new ValidationFailedException("Invalid verification code. Please check and try again.");
            }
            studentRegistrationOtpRepository.delete(record);
        }

        String rawLc = request.leetcodeUsername() != null ? request.leetcodeUsername().trim() : null;
        String rawCf = request.codeforcesHandle() != null ? request.codeforcesHandle().trim() : null;

        // Cross-platform detection and correction
        if (rawLc != null && ClassroomService.isCodeforcesUrl(rawLc) && (rawCf == null || rawCf.isBlank())) {
            rawCf = rawLc;
            rawLc = null;
        } else if (rawCf != null && ClassroomService.isLeetCodeUrl(rawCf) && (rawLc == null || rawLc.isBlank())) {
            rawLc = rawCf;
            rawCf = null;
        }

        String lcUsername = (rawLc != null && !rawLc.isBlank()) ? ClassroomService.extractLeetcodeUsername(rawLc) : null;
        if (lcUsername != null && lcUsername.isEmpty()) {
            lcUsername = null;
        }

        String cfHandle = (rawCf != null && !rawCf.isBlank()) ? ClassroomService.extractCodeforcesHandle(rawCf) : null;
        if (cfHandle != null && cfHandle.isEmpty()) {
            cfHandle = null;
        }

        if (lcUsername == null && cfHandle == null) {
            throw new IllegalArgumentException("Please provide at least one platform username (LeetCode or Codeforces).");
        }

        if (lcUsername != null && studentRepository.findByLeetcodeUsername(lcUsername).isPresent()){
            throw new DuplicateStudentException("LeetCode username '" + lcUsername + "' already in use.");
        }

        if (cfHandle != null && studentRepository.findByCodeforcesHandle(cfHandle).isPresent()){
            throw new DuplicateStudentException("Codeforces handle '" + cfHandle + "' already in use.");
        }

        Student student = new Student();
        student.setName(request.name());
        student.setEmail(request.email());
        student.setPassword(passwordEncoder.encode(request.password()));
        student.setLeetcodeUsername(lcUsername);
        student.setCodeforcesHandle(cfHandle);
        student.setRole(Role.STUDENT);
        student.setAuthProvider(AuthProvider.LOCAL);
        student.setEnabled(true);

        Student savedStudent = studentRepository.save(student);

        // Perform initial profile sync synchronously so newly registered student details are fully ready on first dashboard load
        try {
            log.info("Auto-syncing initial profile data for new student ID: {}", savedStudent.getId());
            Student synced = studentService.syncAllProfileData(savedStudent);
            if (synced != null) {
                savedStudent = synced;
            }
        } catch (Exception e) {
            log.warn("Failed to auto-sync initial profile data for student ID: {}. Error: {}", savedStudent.getId(), e.getMessage());
        }

        return generateAuthResponseForStudent(savedStudent);
    }

    // 2. LOGIN LOGIC

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // 1. Check passwords via Spring Security
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );
        } catch (Exception e) {
            log.warn("Authentication failed for user: {}", request.email());
            throw new UserAuthenticationException("Invalid email or password");
        }

        // 2. Are they a Student?
        var studentOpt = studentRepository.findByEmail(request.email());
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            log.info("Student authenticated successfully: {}", request.email());

            // If the student has never been synced, sync synchronously so they don't see an empty profile
            if (student.getLastSyncedAt() == null) {
                try {
                    log.info("Student {} has never been synced, performing sync on login", student.getId());
                    Student synced = studentService.syncAllProfileData(student);
                    if (synced != null) {
                        student = synced;
                    }
                } catch (Exception e) {
                    log.warn("Failed initial sync on login for student ID: {}. Error: {}", student.getId(), e.getMessage());
                }
            } else {
                // Auto-fetch fresh user details asynchronously upon sign-in
                final Student asyncStudent = student;
                java.util.concurrent.CompletableFuture.runAsync(() -> {
                    try {
                        log.info("Auto-syncing profile data on login for student ID: {}", asyncStudent.getId());
                        studentService.syncAllProfileData(asyncStudent);
                    } catch (Exception e) {
                        log.warn("Failed to auto-sync profile data on login for student ID: {}. Error: {}", asyncStudent.getId(), e.getMessage());
                    }
                });
            }

            return generateAuthResponseForStudent(student);
        }

        // 3. Are they a Mentor?
        var mentorOpt = mentorRepository.findByEmail(request.email());
        if (mentorOpt.isPresent()) {
            log.info("Mentor authenticated successfully: {}", request.email());
            return generateAuthResponseForMentor(mentorOpt.get());
        }

        log.warn("User '{}' authenticated with credentials but not found in student or mentor repositories", request.email());
        throw new UserAuthenticationException("User not found after successful authentication");
    }

    // 3. REFRESH TOKEN LOGIC

    public AuthenticationResponse refreshToken(String requestRefreshToken){
        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getMentorId) // Fetches the generic User ID attached to the token
                .map(userId -> {

                    // Is this ID a Student?
                    var studentOpt = studentRepository.findById(userId);
                    if (studentOpt.isPresent()) {
                        Student student = studentOpt.get();
                        String jwtToken = jwtService.generateToken(student);
                        log.info("Refreshed access token for student: {}", student.getEmail());
                        return AuthenticationResponse.builder()
                                .accessToken(jwtToken)
                                .refreshToken(requestRefreshToken)
                                .userId(student.getId())
                                .mentorId(student.getId())
                                .name(student.getName())
                                .role(student.getRole())
                                .build();
                    }

                    // Is this ID a Mentor?
                    var mentorOpt = mentorRepository.findById(userId);
                    if (mentorOpt.isPresent()) {
                        Mentor mentor = mentorOpt.get();
                        String jwtToken = jwtService.generateToken(mentor);
                        log.info("Refreshed access token for mentor: {}", mentor.getEmail());
                        return AuthenticationResponse.builder()
                                .accessToken(jwtToken)
                                .refreshToken(requestRefreshToken)
                                .userId(mentor.getId())
                                .mentorId(mentor.getId())
                                .name(mentor.getName())
                                .role(mentor.getRole())
                                .build();
                    }

                    log.warn("Refresh token user ID '{}' not found in database", userId);
                    throw new com.tracker.leetcode.tracker.Exception.RefreshTokenException("User associated with refresh token no longer exists.");
                })
                .orElseThrow(() -> new com.tracker.leetcode.tracker.Exception.RefreshTokenException("Invalid or expired refresh token."));
    }

    // 3. CHANGE PASSWORD LOGIC
    public void changePassword(String userEmail, ChangePasswordRequest request) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new UserAuthenticationException("User is not authenticated.");
        }

        if (request.currentPassword() == null || request.currentPassword().isBlank()) {
            throw new ValidationFailedException("Current password is required.");
        }

        if (request.newPassword() == null || request.newPassword().isBlank()) {
            throw new ValidationFailedException("New password is required.");
        }

        if (request.newPassword().length() < 6) {
            throw new ValidationFailedException("New password must be at least 6 characters long.");
        }

        if (request.confirmPassword() != null && !request.confirmPassword().isBlank()) {
            if (!request.newPassword().equals(request.confirmPassword())) {
                throw new ValidationFailedException("New password and confirmation password do not match.");
            }
        }

        // 1. Check if user is a Student
        var studentOpt = studentRepository.findByEmail(userEmail)
                .or(() -> studentRepository.findByEmailIgnoreCase(userEmail));
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            if (!passwordEncoder.matches(request.currentPassword(), student.getPassword())) {
                throw new ValidationFailedException("Current password is incorrect.");
            }
            if (passwordEncoder.matches(request.newPassword(), student.getPassword())) {
                throw new ValidationFailedException("New password cannot be the same as your current password.");
            }
            student.setPassword(passwordEncoder.encode(request.newPassword()));
            studentRepository.save(student);
            log.info("Password changed successfully for student: {}", userEmail);
            return;
        }

        // 2. Check if user is a Mentor or Admin
        var mentorOpt = mentorRepository.findByEmail(userEmail);
        if (mentorOpt.isPresent()) {
            Mentor mentor = mentorOpt.get();
            if (!passwordEncoder.matches(request.currentPassword(), mentor.getPassword())) {
                throw new ValidationFailedException("Current password is incorrect.");
            }
            if (passwordEncoder.matches(request.newPassword(), mentor.getPassword())) {
                throw new ValidationFailedException("New password cannot be the same as your current password.");
            }
            mentor.setPassword(passwordEncoder.encode(request.newPassword()));
            mentorRepository.save(mentor);
            log.info("Password changed successfully for mentor/admin: {}", userEmail);
            return;
        }

        throw new UserAuthenticationException("User account not found.");
    }

    // 4. FORGOT & RESET PASSWORD VIA RESEND OTP

    public Map<String, String> sendStudentRegistrationOtp(SendStudentOtpRequest request) {
        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (email.isBlank()) {
            throw new ValidationFailedException("Email address is required.");
        }

        if (studentRepository.findByEmailIgnoreCase(email).isPresent() ||
            studentRepository.findByEmail(email).isPresent() ||
            mentorRepository.findByEmailIgnoreCase(email).isPresent() ||
            mentorRepository.findByEmail(email).isPresent()) {
            throw new DuplicateStudentException("Email already in use. Please sign in instead.");
        }

        int randomPin;
        try {
            randomPin = SecureRandom.getInstanceStrong().nextInt(900000) + 100000;
        } catch (NoSuchAlgorithmException e) {
            randomPin = new SecureRandom().nextInt(900000) + 100000;
        }
        String otp = String.valueOf(randomPin);

        studentRegistrationOtpRepository.deleteByEmail(email);

        StudentRegistrationOtp record = StudentRegistrationOtp.builder()
                .email(email)
                .otp(otp)
                .expiryDate(Instant.now().plus(Duration.ofMinutes(10)))
                .createdAt(Instant.now())
                .build();
        studentRegistrationOtpRepository.save(record);

        resendEmailService.sendStudentRegistrationOtp(email, otp, request.name());

        log.info("Sent student registration OTP to email: {}", email);
        return Map.of("message", "A 6-digit verification code has been sent to " + email);
    }

    public Map<String, String> sendPasswordResetOtp(ForgotPasswordRequest request) {
        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (email.isBlank()) {
            throw new ValidationFailedException("Email address is required.");
        }

        // Look up user name and verify account exists
        String userName = null;
        var studentOpt = studentRepository.findByEmailIgnoreCase(email)
                .or(() -> studentRepository.findByEmail(email));
        if (studentOpt.isPresent()) {
            userName = studentOpt.get().getName();
        } else {
            var mentorOpt = mentorRepository.findByEmailIgnoreCase(email)
                    .or(() -> mentorRepository.findByEmail(email));
            if (mentorOpt.isPresent()) {
                userName = mentorOpt.get().getName();
            }
        }

        if (userName == null) {
            log.warn("Forgot password requested for non-existent email: {}", email);
            throw new ValidationFailedException("No account registered with email '" + email + "'.");
        }

        // Generate 6-digit cryptographic random OTP
        int randomPin;
        try {
            randomPin = SecureRandom.getInstanceStrong().nextInt(900000) + 100000;
        } catch (NoSuchAlgorithmException e) {
            randomPin = new SecureRandom().nextInt(900000) + 100000;
        }
        String otp = String.valueOf(randomPin);

        // Remove any prior OTP records for this email
        passwordResetOtpRepository.deleteByEmail(email);

        PasswordResetOtp otpRecord = PasswordResetOtp.builder()
                .email(email)
                .otp(otp)
                .verified(false)
                .expiryDate(Instant.now().plus(Duration.ofMinutes(10)))
                .createdAt(Instant.now())
                .build();
        passwordResetOtpRepository.save(otpRecord);

        // Dispatch OTP via Resend
        resendEmailService.sendOtpEmail(email, otp, userName);

        log.info("Sent password reset OTP to email: {}", email);
        return Map.of("message", "A 6-digit verification code has been sent to your email.");
    }

    public VerifyOtpResponse verifyPasswordResetOtp(VerifyOtpRequest request) {
        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        String otp = request.otp() != null ? request.otp().trim() : "";

        if (email.isBlank() || otp.isBlank()) {
            throw new ValidationFailedException("Email and OTP code are required.");
        }

        var otpRecordOpt = passwordResetOtpRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (otpRecordOpt.isEmpty()) {
            throw new ValidationFailedException("No pending verification found for this email. Please request a new code.");
        }

        PasswordResetOtp record = otpRecordOpt.get();
        if (record.getExpiryDate().isBefore(Instant.now())) {
            passwordResetOtpRepository.delete(record);
            throw new ValidationFailedException("Verification code has expired. Please request a new one.");
        }

        if (!record.getOtp().equals(otp)) {
            throw new ValidationFailedException("Invalid verification code. Please check and try again.");
        }

        String resetToken = UUID.randomUUID().toString();
        record.setVerified(true);
        record.setResetToken(resetToken);
        record.setExpiryDate(Instant.now().plus(Duration.ofMinutes(15))); // Allow 15 mins to set password
        passwordResetOtpRepository.save(record);

        log.info("OTP verified successfully for email: {}", email);
        return new VerifyOtpResponse(
                "Code verified successfully. You may now set a new password.",
                resetToken
        );
    }

    public Map<String, String> resetPasswordWithOtp(ResetPasswordRequest request) {
        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        String newPassword = request.newPassword() != null ? request.newPassword() : "";
        String confirmPassword = request.confirmPassword() != null ? request.confirmPassword() : "";
        String resetToken = request.resetToken() != null ? request.resetToken().trim() : "";
        String directOtp = request.otp() != null ? request.otp().trim() : "";

        if (email.isBlank()) {
            throw new ValidationFailedException("Email address is required.");
        }
        if (newPassword.isBlank() || newPassword.length() < 6) {
            throw new ValidationFailedException("New password must be at least 6 characters long.");
        }
        if (!confirmPassword.isBlank() && !newPassword.equals(confirmPassword)) {
            throw new ValidationFailedException("New password and confirmation password do not match.");
        }

        PasswordResetOtp validRecord = null;
        if (!resetToken.isBlank()) {
            var tokenMatch = passwordResetOtpRepository.findByEmailAndResetToken(email, resetToken);
            if (tokenMatch.isPresent() && tokenMatch.get().isVerified()) {
                validRecord = tokenMatch.get();
            }
        }

        if (validRecord == null && !directOtp.isBlank()) {
            var otpMatch = passwordResetOtpRepository.findTopByEmailOrderByCreatedAtDesc(email);
            if (otpMatch.isPresent() && directOtp.equals(otpMatch.get().getOtp())) {
                validRecord = otpMatch.get();
            }
        }

        if (validRecord == null) {
            throw new ValidationFailedException("Invalid or expired password reset session. Please request a new OTP.");
        }

        if (validRecord.getExpiryDate().isBefore(Instant.now())) {
            passwordResetOtpRepository.delete(validRecord);
            throw new ValidationFailedException("Password reset session has expired. Please request a new OTP.");
        }

        var studentOpt = studentRepository.findByEmailIgnoreCase(email)
                .or(() -> studentRepository.findByEmail(email));
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setPassword(passwordEncoder.encode(newPassword));
            studentRepository.save(student);
            refreshTokenService.deleteByMentorId(student.getId());
            passwordResetOtpRepository.delete(validRecord);
            log.info("Password successfully reset for student: {}", email);
            return Map.of("message", "Password reset successfully. Please log in with your new password.");
        }

        var mentorOpt = mentorRepository.findByEmailIgnoreCase(email)
                .or(() -> mentorRepository.findByEmail(email));
        if (mentorOpt.isPresent()) {
            Mentor mentor = mentorOpt.get();
            mentor.setPassword(passwordEncoder.encode(newPassword));
            mentorRepository.save(mentor);
            refreshTokenService.deleteByMentorId(mentor.getId());
            passwordResetOtpRepository.delete(validRecord);
            log.info("Password successfully reset for mentor: {}", email);
            return Map.of("message", "Password reset successfully. Please log in with your new password.");
        }

        throw new UserAuthenticationException("Account not found for email: " + email);
    }

    // 5. DRY HELPER METHODS

    private AuthenticationResponse generateAuthResponseForStudent(Student student) {
        String jwtToken = jwtService.generateToken(student);

        refreshTokenService.deleteByMentorId(student.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(student.getId());

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(student.getId())
                .mentorId(student.getId())
                .name(student.getName())
                .role(student.getRole())
                .build();
    }

    private AuthenticationResponse generateAuthResponseForMentor(Mentor mentor) {
        String jwtToken = jwtService.generateToken(mentor);

        refreshTokenService.deleteByMentorId(mentor.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(mentor.getId());

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(mentor.getId())
                .mentorId(mentor.getId())
                .name(mentor.getName())
                .role(mentor.getRole())
                .build();
    }
}