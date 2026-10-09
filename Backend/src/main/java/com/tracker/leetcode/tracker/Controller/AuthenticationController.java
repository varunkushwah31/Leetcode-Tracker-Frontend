package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.AuthenticationRequest;
import com.tracker.leetcode.tracker.DTO.AuthenticationResponse;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.DTO.StudentRegisterRequest;
import com.tracker.leetcode.tracker.DTO.ForgotPasswordRequest;
import com.tracker.leetcode.tracker.DTO.VerifyOtpRequest;
import com.tracker.leetcode.tracker.DTO.ResetPasswordRequest;
import com.tracker.leetcode.tracker.DTO.VerifyOtpResponse;
import com.tracker.leetcode.tracker.Exception.RefreshTokenException;
import com.tracker.leetcode.tracker.Service.AuthenticationService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

import com.tracker.leetcode.tracker.Service.RefreshTokenService;
import com.tracker.leetcode.tracker.Service.TokenBlacklistService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final TokenBlacklistService tokenBlacklistService;
    private final RefreshTokenService refreshTokenService;

    @Value("${application.security.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${application.security.cookie.same-site:Lax}")
    private String cookieSameSite;

    // Helper to build the secure cookie
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/v1/auth/refresh")
                .maxAge(Duration.ofDays(7))
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response){

        AuthenticationResponse authResponse = authenticationService.register(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());

        // Return everything EXCEPT the refresh token in the JSON body (it's in the cookie now!)
        return ResponseEntity.ok(AuthenticationResponse.builder()
                .accessToken(authResponse.accessToken())
                .userId(authResponse.userId() != null ? authResponse.userId() : authResponse.mentorId())
                .mentorId(authResponse.mentorId())
                .name(authResponse.name())
                .role(authResponse.role())
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @Valid @RequestBody AuthenticationRequest request,
            HttpServletResponse response) {
        AuthenticationResponse authResponse = authenticationService.authenticate(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());

        return ResponseEntity.ok(AuthenticationResponse.builder()
                .accessToken(authResponse.accessToken())
                .userId(authResponse.userId() != null ? authResponse.userId() : authResponse.mentorId())
                .mentorId(authResponse.mentorId())
                .name(authResponse.name())
                .role(authResponse.role())
                .build());
    }

    // The Refresh Endpoint
    @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new RefreshTokenException("Refresh token cookie is missing.");
        }

        // Rotate the tokens
        AuthenticationResponse authResponse = authenticationService.refreshToken(refreshToken);

        // Set the NEW rotated refresh token in the cookie
        setRefreshTokenCookie(response, authResponse.refreshToken());

        // Return the NEW access token
        return ResponseEntity.ok(AuthenticationResponse.builder()
                .accessToken(authResponse.accessToken())
                .userId(authResponse.userId() != null ? authResponse.userId() : authResponse.mentorId())
                .mentorId(authResponse.mentorId())
                .name(authResponse.name())
                .role(authResponse.role())
                .build());
    }

    // Logout Endpoint
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        // 1. Blacklist the access token in Redis
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            tokenBlacklistService.blacklistToken(authHeader.substring(7));
        }

        // 2. Revoke the refresh token in database
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.deleteByToken(refreshToken);
        }

        // 3. Clear refresh_token cookie
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/v1/auth/refresh")
                .maxAge(0)
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register/student/send-otp")
    public ResponseEntity<java.util.Map<String, String>> sendStudentRegistrationOtp(
            @Valid @RequestBody com.tracker.leetcode.tracker.DTO.SendStudentOtpRequest request) {
        var response = authenticationService.sendStudentRegistrationOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/student")
    public ResponseEntity<AuthenticationResponse> registerStudent(
            @Valid @RequestBody StudentRegisterRequest request,
            HttpServletResponse response){
        AuthenticationResponse authResponse = authenticationService.registerStudent(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());

        return ResponseEntity.ok(AuthenticationResponse.builder()
                .accessToken(authResponse.accessToken())
                .userId(authResponse.userId() != null ? authResponse.userId() : authResponse.mentorId())
                .mentorId(authResponse.mentorId())
                .name(authResponse.name())
                .role(authResponse.role())
                .build());
    }

    @PostMapping("/change-password")
    public ResponseEntity<java.util.Map<String, String>> changePassword(
            @Valid @RequestBody com.tracker.leetcode.tracker.DTO.ChangePasswordRequest request,
            org.springframework.security.core.Authentication authentication) {

        if (authentication == null || authentication.getName() == null || authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            throw new com.tracker.leetcode.tracker.Exception.UserAuthenticationException("You must be logged in to change your password.");
        }

        authenticationService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(java.util.Map.of("message", "Password changed successfully."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        var response = authenticationService.sendPasswordResetOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        var response = authenticationService.verifyPasswordResetOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        var response = authenticationService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(response);
    }
}