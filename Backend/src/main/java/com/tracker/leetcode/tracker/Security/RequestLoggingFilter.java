package com.tracker.leetcode.tracker.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    public static final String TRACE_ID_HEADER = "X-Request-ID";
    public static final String MDC_TRACE_ID_KEY = "traceId";
    public static final String MDC_CLIENT_IP_KEY = "clientIp";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Generate or extract trace ID
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = "req-" + UUID.randomUUID().toString().substring(0, 8);
        }

        String clientIp = extractClientIp(request);

        // 2. Put into MDC for structured logging across all components
        MDC.put(MDC_TRACE_ID_KEY, traceId);
        MDC.put(MDC_CLIENT_IP_KEY, clientIp);

        // 3. Expose trace ID in response header for client debugging
        response.setHeader(TRACE_ID_HEADER, traceId);

        long startTime = System.currentTimeMillis();
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // Avoid logging noisy health checks
        boolean isHealth = "/health".equals(uri);
        if (!isHealth) {
            log.info("[HTTP IN ] {} {} from IP [{}] (traceId: {})", method, uri, clientIp, traceId);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            if (!isHealth) {
                if (status >= 500) {
                    log.error("[HTTP OUT] {} {} -> HTTP {} (took {}ms, traceId: {})", method, uri, status, duration, traceId);
                } else if (status >= 400) {
                    log.warn("[HTTP OUT] {} {} -> HTTP {} (took {}ms, traceId: {})", method, uri, status, duration, traceId);
                } else {
                    log.info("[HTTP OUT] {} {} -> HTTP {} (took {}ms, traceId: {})", method, uri, status, duration, traceId);
                }
            }

            // Always clear MDC to prevent thread pool leakage
            MDC.remove(MDC_TRACE_ID_KEY);
            MDC.remove(MDC_CLIENT_IP_KEY);
        }
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
