package com.tracker.leetcode.tracker.Exception;

import com.tracker.leetcode.tracker.Security.RequestLoggingFilter;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request,
            Map<String, String> validationErrors
    ) {
        String traceId = MDC.get(RequestLoggingFilter.MDC_TRACE_ID_KEY);
        String path = request != null ? request.getRequestURI() : null;

        ErrorResponse errorResponse = ErrorResponse.builder()
                .time(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .message(message)
                .path(path)
                .traceId(traceId)
                .validationErrors(validationErrors)
                .build();

        return new ResponseEntity<>(errorResponse, status);
    }

    // 1. Authentication & Authorization Errors
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Failed login attempt on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password.", request, null);
    }

    @ExceptionHandler(UserAuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleUserAuthenticationException(UserAuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication error on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage(), request, null);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFound(UsernameNotFoundException ex, HttpServletRequest request) {
        log.warn("User not found during authentication on path [{}]", request.getRequestURI());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password.", request, null);
    }

    @ExceptionHandler({TokenRefreshException.class, RefreshTokenException.class})
    public ResponseEntity<ErrorResponse> handleTokenRefreshException(RuntimeException ex, HttpServletRequest request) {
        log.warn("Refresh token failure on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage(), request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to access this resource.", request, null);
    }

    // 2. Resource Not Found Errors (404)
    @ExceptionHandler({
            StudentNotFoundException.class,
            MentorNotFoundException.class,
            ClassroomNotFoundException.class,
            AssignmentNotFoundException.class,
            LearningPathNotFoundException.class
    })
    public ResponseEntity<ErrorResponse> handleNotFoundExceptions(RuntimeException ex, HttpServletRequest request) {
        log.warn("Resource Not Found on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), request, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        log.warn("No resource found on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, "Not Found", "Resource not found: " + ex.getResourcePath(), request, null);
    }

    // 3. Conflict Errors (409)
    @ExceptionHandler({
            DuplicateMentorException.class,
            DuplicateStudentException.class,
            StudentAlreadyEnrolledException.class
    })
    public ResponseEntity<ErrorResponse> handleConflicts(RuntimeException ex, HttpServletRequest request) {
        log.warn("Conflict error on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "Conflict", ex.getMessage(), request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "Conflict", "A record with the same unique data already exists.", request, null);
    }

    // 4. Client Request & Validation Errors (400)
    @ExceptionHandler(ValidationFailedException.class)
    public ResponseEntity<ErrorResponse> handleValidationFailed(ValidationFailedException ex, HttpServletRequest request) {
        log.warn("Validation failed on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), request, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Illegal argument on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        String summary = "Validation failed for field(s): " + String.join(", ", fieldErrors.keySet());
        log.warn("DTO Validation Failed on path [{}]: {}", request.getRequestURI(), fieldErrors);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Bad Request", summary, request, fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON request body on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Bad Request", "Malformed or unreadable JSON request body.", request, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String expectedType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "valid type";
        String message = "Parameter '" + ex.getName() + "' must be of type " + expectedType;
        log.warn("Type mismatch on path [{}]: {}", request.getRequestURI(), message);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Bad Request", message, request, null);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        String message = "Required request parameter '" + ex.getParameterName() + "' is missing.";
        log.warn("Missing parameter on path [{}]: {}", request.getRequestURI(), message);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Bad Request", message, request, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        String message = "HTTP method '" + ex.getMethod() + "' is not supported for this endpoint.";
        log.warn("Method not supported on path [{}]: {}", request.getRequestURI(), message);
        return buildErrorResponse(HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed", message, request, null);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        String message = "Content type '" + ex.getContentType() + "' is not supported.";
        log.warn("Media type not supported on path [{}]: {}", request.getRequestURI(), message);
        return buildErrorResponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported Media Type", message, request, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("Max upload size exceeded on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "Payload Too Large", "Uploaded file exceeds the maximum allowed size.", request, null);
    }

    // 5. External API & Rate Limiting / Circuit Breaker Errors
    @ExceptionHandler(LeetCodeApiException.class)
    public ResponseEntity<ErrorResponse> handleLeetCodeApiError(LeetCodeApiException ex, HttpServletRequest request) {
        log.warn("External LeetCode API Error on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_GATEWAY, "Bad Gateway", ex.getMessage(), request, null);
    }

    @ExceptionHandler(CodeforcesApiException.class)
    public ResponseEntity<ErrorResponse> handleCodeforcesApiError(CodeforcesApiException ex, HttpServletRequest request) {
        log.warn("External Codeforces API Error on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_GATEWAY, "Bad Gateway", ex.getMessage(), request, null);
    }

    @ExceptionHandler(RequestNotPermitted.class)
    public ResponseEntity<ErrorResponse> handleRequestNotPermitted(RequestNotPermitted ex, HttpServletRequest request) {
        log.warn("LeetCode upstream rate limit reached on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests",
                "LeetCode API rate limit reached. Please wait a moment before trying again.", request, null);
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceeded(RateLimitExceededException ex, HttpServletRequest request) {
        log.warn("Application rate limit exceeded on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", ex.getMessage(), request, null);
    }

    @ExceptionHandler(CallNotPermittedException.class)
    public ResponseEntity<ErrorResponse> handleCallNotPermittedException(CallNotPermittedException ex, HttpServletRequest request) {
        log.warn("LeetCode circuit breaker OPEN on path [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, "Service Unavailable",
                "LeetCode integration is temporarily unavailable. Please try again shortly.", request, null);
    }

    // 6. Generic Fallback for Unexpected Errors (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        String traceId = MDC.get(RequestLoggingFilter.MDC_TRACE_ID_KEY);
        log.error("Unhandled server exception on [{} {}] (traceId: {}): ",
                request.getMethod(), request.getRequestURI(), traceId, ex);

        String message = "An unexpected server error occurred. Reference ID: " + (traceId != null ? traceId : "N/A");
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                message,
                request,
                null
        );
    }
}