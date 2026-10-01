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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull AccessDeniedException accessDeniedException
    ) throws IOException, ServletException {

        String traceId = MDC.get(RequestLoggingFilter.MDC_TRACE_ID_KEY);
        log.warn("Access denied on [{} {}] (traceId: {}): {}",
                request.getMethod(), request.getRequestURI(), traceId, accessDeniedException.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .time(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error("Forbidden")
                .message("You do not have permission to access this resource.")
                .path(request.getRequestURI())
                .traceId(traceId)
                .build();

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        OutputStream responseStream = response.getOutputStream();
        objectMapper.writeValue(responseStream, errorResponse);
        responseStream.flush();
    }
}
