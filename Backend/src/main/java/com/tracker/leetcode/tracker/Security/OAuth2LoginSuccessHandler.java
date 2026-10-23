package com.tracker.leetcode.tracker.Security;

import com.tracker.leetcode.tracker.Models.AuthProvider;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.RefreshToken;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Models.SocialMedia;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String ATTR_LOGIN = "login";
    private static final String PARAM_ERROR = "error";

    private final MentorRepository mentorRepository;
    private final StudentRepository studentRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Value("${application.oauth2.redirect-uri:${APP_OAUTH2_REDIRECT_URI:http://localhost:5173/oauth2/redirect}}")
    private String frontendRedirectUri;

    @Value("${application.security.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${application.security.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String providerName = "google";
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            providerName = oauthToken.getAuthorizedClientRegistrationId();
        }

        AuthProvider authProvider = "github".equalsIgnoreCase(providerName) ? AuthProvider.GITHUB : AuthProvider.GOOGLE;

        // 1. Extract user attributes safely across Google and GitHub
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        if (picture == null) {
            picture = oAuth2User.getAttribute("avatar_url"); // GitHub
        }
        if (name == null || name.isBlank()) {
            name = oAuth2User.getAttribute(ATTR_LOGIN); // GitHub fallback
        }

        log.info("OAuth2 Login successful from provider [{}] for email [{}]", providerName, email);

        if (email == null || email.isBlank()) {
            log.warn("OAuth2 provider [{}] did not return an email address.", providerName);
            String errorMsg = "Could not retrieve email from " + providerName + ". Please ensure your email is verified and public on " + providerName + ".";
            String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                    .queryParam(PARAM_ERROR, errorMsg)
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        // 2. Check existing user in Student and Mentor collections
        Optional<Student> studentOptional = studentRepository.findByEmail(email);
        Optional<Mentor> mentorOptional = mentorRepository.findByEmail(email);

        String userId;
        String userName;
        Role userRole;
        UserDetails userDetails;

        if (studentOptional.isPresent()) {
            Student student = studentOptional.get();
            if (!student.isEnabled()) {
                String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                        .queryParam(PARAM_ERROR, "Your student account has been disabled. Please contact your mentor.")
                        .build().toUriString();
                getRedirectStrategy().sendRedirect(request, response, targetUrl);
                return;
            }
            if (student.getAvatarUrl() == null && picture != null) {
                student.setAvatarUrl(picture);
            }
            if (student.getAuthProvider() == null || student.getAuthProvider() == AuthProvider.LOCAL) {
                student.setAuthProvider(authProvider);
            }
            studentRepository.save(student);

            userId = student.getId();
            userName = student.getName();
            userRole = student.getRole() != null ? student.getRole() : Role.STUDENT;
            userDetails = student;
        } else if (mentorOptional.isPresent()) {
            Mentor mentor = mentorOptional.get();
            if (!mentor.isEnabled()) {
                String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                        .queryParam(PARAM_ERROR, "Your mentor account has been disabled. Please contact support.")
                        .build().toUriString();
                getRedirectStrategy().sendRedirect(request, response, targetUrl);
                return;
            }
            if (mentor.getProvider() == null || mentor.getProvider() == AuthProvider.LOCAL) {
                mentor.setProvider(authProvider);
            }
            mentorRepository.save(mentor);

            userId = mentor.getId();
            userName = mentor.getName();
            userRole = mentor.getRole() != null ? mentor.getRole() : Role.MENTOR;
            userDetails = mentor;
        } else {
            // Register new user as STUDENT
            log.info("Auto-registering new student via OAuth2 [{}] for: {}", authProvider, email);
            Student student = new Student();
            student.setEmail(email);
            student.setName(name != null && !name.isBlank() ? name : email.split("@")[0]);
            student.setRole(Role.STUDENT);
            student.setAuthProvider(authProvider);
            student.setEnabled(true);
            if (picture != null) {
                student.setAvatarUrl(picture);
            }
            if (authProvider == AuthProvider.GITHUB && oAuth2User.getAttribute(ATTR_LOGIN) != null) {
                String githubUsername = oAuth2User.getAttribute(ATTR_LOGIN);
                student.setSocialMedia(new SocialMedia(githubUsername, null, null));
            }
            student = studentRepository.save(student);

            userId = student.getId();
            userName = student.getName();
            userRole = Role.STUDENT;
            userDetails = student;
        }

        // 3. Generate tokens
        String accessToken = jwtService.generateToken(userDetails);

        refreshTokenService.deleteByMentorId(userId);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userId);

        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken.getToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/v1/auth/refresh")
                .maxAge(Duration.ofDays(7))
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 4. Redirect to Frontend callback handler with token and user details
        String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("token", accessToken)
                .queryParam("userId", userId)
                .queryParam("name", userName)
                .queryParam("role", userRole.name())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
