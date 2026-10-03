package com.tracker.leetcode.tracker.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final MentorRepository mentorRepository;
    private final StudentRepository studentRepository;
    private final com.tracker.leetcode.tracker.Service.TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
            ) throws ServletException , IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Check if the Authorization header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Pass it down the chain (it will likely be rejected later)
            return;
        }

        // 2. Extract the token (Remove "Bearer " from the string)
        jwt = authHeader.substring(7);

        // Check if token was blacklisted via Redis
        if (tokenBlacklistService.isTokenBlacklisted(jwt)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Token has been revoked or logged out.\"}");
            return;
        }

        // 3. Extract the email from the token
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception ex) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. If we have an email and the user is NOT already authenticated in this session...
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null){

            // Fetch the user from the database matching the role claimed in the JWT
            UserDetails userDetails = null;
            final List<String> roles = jwtService.extractRoles(jwt);

            if (roles != null && (roles.contains("ROLE_MENTOR") || roles.contains("ROLE_SUPER_ADMIN"))) {
                userDetails = mentorRepository.findByEmail(userEmail).orElse(null);
            } else if (roles != null && roles.contains("ROLE_STUDENT")) {
                userDetails = studentRepository.findByEmail(userEmail).orElse(null);
            }

            if (userDetails == null) {
                try {
                    userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                } catch (UsernameNotFoundException ex) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid credentials.");
                    return;
                }
            }

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Officially log the user in for this specific request
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request,response);
    }

}
