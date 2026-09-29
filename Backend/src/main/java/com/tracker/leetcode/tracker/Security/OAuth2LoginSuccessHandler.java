package com.tracker.leetcode.tracker.Security;

import com.tracker.leetcode.tracker.Models.AuthProvider;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.RefreshToken;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final MentorRepository mentorRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @org.springframework.beans.factory.annotation.Value("${application.security.oauth2.redirect-uri:http://localhost:5173/oauth2/redirect}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException{
        // 1. Extract user info from Google's response
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        log.info("OAuth2 Login successful for email: {}", email);

        // 2. Check if user exists in our DB, if not, register them automatically
        Optional<Mentor> mentorOptional = mentorRepository.findByEmail(email);
        Mentor mentor;

        if (mentorOptional.isEmpty()){
            log.info("New user logging via Google. Registering account...");
            mentor = new Mentor();
            mentor.setEmail(email);
            mentor.setName(name);
            mentor.setRole(Role.MENTOR);
            mentor.setProvider(AuthProvider.GOOGLE);
            mentor.setEnabled(true);
            // Notice: We don't set a password because they use Google to log in!
            mentor = mentorRepository.save(mentor);
        }else {
            mentor = mentorOptional.get();
            // Optional: You could check if (mentor.getProvider() != AuthProvider.GOOGLE) here
            // to prevent someone who registered locally from bypassing password login.
        }
        // 3. Generate our internal system tokens
        String accessToken = jwtService.generateToken(mentor);

        refreshTokenService.deleteByMentorId(mentor.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(mentor.getId());

        Cookie cookie = new Cookie("refresh_token",refreshToken.getToken());
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(7*24*60*60);
        response.addCookie(cookie);

        String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("token", accessToken)
                .queryParam("userId", mentor.getId())
                .queryParam("name", mentor.getName())
                .queryParam("role", mentor.getRole().name())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
