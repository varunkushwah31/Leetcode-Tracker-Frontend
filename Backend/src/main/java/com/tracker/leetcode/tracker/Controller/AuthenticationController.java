package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.AuthenticationRequest;
import com.tracker.leetcode.tracker.DTO.AuthenticationResponse;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.DTO.StudentRegisterRequest;
import com.tracker.leetcode.tracker.Service.AuthenticationService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

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
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request,HttpServletResponse response){

        AuthenticationResponse authResponse = authenticationService.register(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());

        // Return everything EXCEPT the refresh token in the JSON body (it's in the cookie now!)
        return ResponseEntity.ok(AuthenticationResponse.builder()
                .accessToken(authResponse.accessToken())
                .userId(authResponse.userId() != null ? authResponse.userId() : authResponse.mentorId())
                .mentorId(authResponse.mentorId())
                .name(authResponse.name())
                .role(authResponse.role()) // <-- FIXED: Added Role
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request,
            HttpServletResponse response) {
        AuthenticationResponse authResponse = authenticationService.authenticate(request);
        setRefreshTokenCookie(response,authResponse.refreshToken());

        return ResponseEntity.ok(AuthenticationResponse.builder()
                .accessToken(authResponse.accessToken())
                .userId(authResponse.userId() != null ? authResponse.userId() : authResponse.mentorId())
                .mentorId(authResponse.mentorId())
                .name(authResponse.name())
                .role(authResponse.role()) // <-- FIXED: Added Role
                .build());
    }

    // NEW: The Refresh Endpoint
    @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null) {
            return ResponseEntity.status(401).build(); // No cookie, no refresh!
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

    // NEW: Logout Endpoint
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear refresh_token cookie
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

    @PostMapping("/register/student")
    public ResponseEntity<AuthenticationResponse> registerStudent(
            @RequestBody StudentRegisterRequest request,
            HttpServletResponse response){
        AuthenticationResponse authResponse = authenticationService.registerStudent(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());

        return ResponseEntity.ok(AuthenticationResponse.builder()
                .accessToken(authResponse.accessToken())
                .userId(authResponse.userId() != null ? authResponse.userId() : authResponse.mentorId())
                .mentorId(authResponse.mentorId())
                .name(authResponse.name())
                .role(authResponse.role()) // <-- FIXED: Added Role
                .build());
    }
}