package com.tracker.leetcode.tracker.Security;

import com.tracker.leetcode.tracker.Exception.ErrorResponse;
import com.tracker.leetcode.tracker.Service.RateLimitingService;
import com.tracker.leetcode.tracker.Service.RateLimitingService.RateLimitResult;
import com.tracker.leetcode.tracker.Service.RateLimitingService.Tier;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;

@Slf4j
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 1. Skip CORS preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // 2. Skip health endpoint & WebSocket handshake
        if ("/health".equals(path) || path.startsWith("/ws-endpoint")) {
            return true;
        }

        // 3. Skip static assets or non-API endpoints
        return !path.startsWith("/api");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        Tier tier = determineTier(path);
        String clientIdentifier = resolveClientIdentifier(request);

        RateLimitResult result = rateLimitingService.checkLimit(clientIdentifier, tier);

        // Always attach standard rate limit metadata headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.getResetSeconds()));

        if (!result.isAllowed()) {
            String traceId = MDC.get(RequestLoggingFilter.MDC_TRACE_ID_KEY);
            log.warn("Rate limit exceeded for client [{}] on [{} {}] - tier: [{}], remaining: 0, reset in {}s (traceId: {})",
                    clientIdentifier, request.getMethod(), path, tier, result.getResetSeconds(), traceId);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(result.getResetSeconds()));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ErrorResponse errorResponse = ErrorResponse.builder()
                    .time(LocalDateTime.now())
                    .status(HttpStatus.TOO_MANY_REQUESTS.value())
                    .error("Too Many Requests")
                    .message("Rate limit exceeded. Please wait " + result.getResetSeconds() + " seconds before trying again.")
                    .path(path)
                    .traceId(traceId)
                    .build();

            OutputStream out = response.getOutputStream();
            objectMapper.writeValue(out, errorResponse);
            out.flush();
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Tier determineTier(String path) {
        if (path.startsWith("/api/v1/auth")) {
            // Logout does not require strict auth throttling
            if (path.endsWith("/logout")) {
                return Tier.GENERAL;
            }
            return Tier.AUTH;
        }

        // Heavy LeetCode synchronization & manual submission endpoints
        if (path.matches("/api/students/[^/]+/sync")
                || path.matches("/api/students/[^/]+/fetch")
                || path.matches("/api/students/[^/]+/stats/fetch")
                || path.matches("/api/students/[^/]+/recent/fetch")
                || path.matches("/api/students/[^/]+/extended/fetch")
                || path.contains("/validate")
                || path.contains("/nudge")) {
            return Tier.LEETCODE_SYNC;
        }

        return Tier.GENERAL;
    }

    private String resolveClientIdentifier(HttpServletRequest request) {
        // If user is authenticated, rate limit per user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "user:" + auth.getName();
        }

        // Otherwise rate limit per IP
        return "ip:" + extractClientIp(request);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
