package com.tracker.leetcode.tracker.Security;

import com.tracker.leetcode.tracker.Exception.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(@NonNull HttpServletRequest request, HttpServletResponse response, @NonNull AuthenticationException authException)
            throws IOException, ServletException {

        String traceId = MDC.get(RequestLoggingFilter.MDC_TRACE_ID_KEY);
        log.warn("Unauthorized access on [{} {}] (traceId: {}): {}",
                request.getMethod(), request.getRequestURI(), traceId, authException.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .time(LocalDateTime.now(ZoneId.systemDefault()))
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Unauthorized")
                .message("Missing, invalid, or expired authentication token.")
                .path(request.getRequestURI())
                .traceId(traceId)
                .build();

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        OutputStream responseStream = response.getOutputStream();
        objectMapper.writeValue(responseStream, errorResponse);
        responseStream.flush();
    }
}