package com.tracker.leetcode.tracker.Exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime time;
    private int status;
    private String error;
    private String message;
    private String path;
    private String traceId;
    private Map<String, String> validationErrors;

    // Backward-compatible constructor for existing callers
    public ErrorResponse(LocalDateTime time, int status, String error, String message) {
        this.time = time;
        this.status = status;
        this.error = error;
        this.message = message;
    }

    public ErrorResponse(LocalDateTime time, int status, String error, String message, String path) {
        this.time = time;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }
}
