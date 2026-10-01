package com.tracker.leetcode.tracker.Exception;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/test");
        request.setMethod("POST");
        MDC.put("traceId", "test-trace-1234");
    }

    @Test
    void handleRequestNotPermitted_ShouldReturn429WithStructuredResponse() {
        RateLimiter rateLimiter = RateLimiter.ofDefaults("leetcodeApi");
        RequestNotPermitted ex = RequestNotPermitted.createRequestNotPermitted(rateLimiter);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleRequestNotPermitted(ex, request);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(429, response.getBody().getStatus());
        assertEquals("Too Many Requests", response.getBody().getError());
        assertEquals("/api/test", response.getBody().getPath());
        assertEquals("test-trace-1234", response.getBody().getTraceId());
        assertTrue(response.getBody().getMessage().contains("rate limit reached"));
    }

    @Test
    void handleCallNotPermittedException_ShouldReturn503WithServiceUnavailable() {
        CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("leetcodeApi");
        CallNotPermittedException ex = CallNotPermittedException.createCallNotPermittedException(circuitBreaker);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleCallNotPermittedException(ex, request);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(503, response.getBody().getStatus());
        assertEquals("/api/test", response.getBody().getPath());
        assertTrue(response.getBody().getMessage().contains("temporarily unavailable"));
    }

    @Test
    void handleRateLimitExceeded_ShouldReturn429WithCustomMessage() {
        RateLimitExceededException ex = new RateLimitExceededException("Too many login attempts. Retry in 45s.", 45);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleRateLimitExceeded(ex, request);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(429, response.getBody().getStatus());
        assertEquals("Too many login attempts. Retry in 45s.", response.getBody().getMessage());
    }

    @Test
    void handleStudentNotFound_ShouldReturn404() {
        StudentNotFoundException ex = new StudentNotFoundException("Student 'alice' not found");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleNotFoundExceptions(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Student 'alice' not found", response.getBody().getMessage());
    }

    @Test
    void handleBadCredentials_ShouldReturn401() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadCredentials(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().getStatus());
        assertEquals("Invalid email or password.", response.getBody().getMessage());
    }

    @Test
    void handleAccessDenied_ShouldReturn403() {
        AccessDeniedException ex = new AccessDeniedException("Access denied");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getStatus());
        assertEquals("You do not have permission to access this resource.", response.getBody().getMessage());
    }

    @Test
    void handleValidationExceptions_ShouldReturn400WithFieldErrorsMap() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "registerRequest");
        bindingResult.addError(new FieldError("registerRequest", "email", "Must be a valid email address"));
        bindingResult.addError(new FieldError("registerRequest", "password", "Password must be at least 6 characters"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMethodArgumentNotValid(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertNotNull(response.getBody().getValidationErrors());
        assertEquals(2, response.getBody().getValidationErrors().size());
        assertEquals("Must be a valid email address", response.getBody().getValidationErrors().get("email"));
        assertEquals("Password must be at least 6 characters", response.getBody().getValidationErrors().get("password"));
    }
}
