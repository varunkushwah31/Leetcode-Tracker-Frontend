package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Date;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private JwtService jwtService;

    private TokenBlacklistService tokenBlacklistService;

    @BeforeEach
    void setUp() {
        tokenBlacklistService = new TokenBlacklistService(stringRedisTemplate, jwtService);
    }

    @Test
    void blacklistToken_WhenTokenValid_ShouldSetInRedis() {
        String token = "valid-jwt-token";
        Date futureDate = new Date(System.currentTimeMillis() + 600000); // 10 mins in future
        when(jwtService.extractExpiration(token)).thenReturn(futureDate);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        tokenBlacklistService.blacklistToken(token);

        verify(valueOperations, times(1)).set(
                startsWith("blacklist:jwt:"),
                eq("revoked"),
                anyLong(),
                eq(TimeUnit.MILLISECONDS)
        );
    }

    @Test
    void blacklistToken_WhenTokenExpired_ShouldNotStoreInRedis() {
        String token = "expired-token";
        Date pastDate = new Date(System.currentTimeMillis() - 10000);
        when(jwtService.extractExpiration(token)).thenReturn(pastDate);

        tokenBlacklistService.blacklistToken(token);

        verify(stringRedisTemplate, never()).opsForValue();
    }

    @Test
    void isTokenBlacklisted_WhenKeyExistsInRedis_ShouldReturnTrue() {
        String token = "blacklisted-token";
        when(stringRedisTemplate.hasKey(startsWith("blacklist:jwt:"))).thenReturn(true);

        boolean result = tokenBlacklistService.isTokenBlacklisted(token);

        assertTrue(result);
    }

    @Test
    void isTokenBlacklisted_WhenKeyDoesNotExistInRedis_ShouldReturnFalse() {
        String token = "clean-token";
        when(stringRedisTemplate.hasKey(startsWith("blacklist:jwt:"))).thenReturn(false);

        boolean result = tokenBlacklistService.isTokenBlacklisted(token);

        assertFalse(result);
    }

    @Test
    void blacklistUser_ShouldSetUserRevocationKey() {
        String userId = "user-123";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        tokenBlacklistService.blacklistUser(userId, Duration.ofHours(1));

        verify(valueOperations, times(1)).set(
                eq("blacklist:user:user-123"),
                anyString(),
                eq(Duration.ofHours(1))
        );
    }

    @Test
    void isUserRevoked_WhenIssuedBeforeRevocation_ShouldReturnTrue() {
        String userId = "user-123";
        long revocationTimestamp = System.currentTimeMillis();
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("blacklist:user:user-123")).thenReturn(String.valueOf(revocationTimestamp));

        Date tokenIssuedAt = new Date(revocationTimestamp - 5000); // Issued 5s before revocation
        boolean revoked = tokenBlacklistService.isUserRevoked(userId, tokenIssuedAt);

        assertTrue(revoked);
    }

    @Test
    void isUserRevoked_WhenIssuedAfterRevocation_ShouldReturnFalse() {
        String userId = "user-123";
        long revocationTimestamp = System.currentTimeMillis() - 10000;
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("blacklist:user:user-123")).thenReturn(String.valueOf(revocationTimestamp));

        Date tokenIssuedAt = new Date(System.currentTimeMillis()); // Issued now, after revocation
        boolean revoked = tokenBlacklistService.isUserRevoked(userId, tokenIssuedAt);

        assertFalse(revoked);
    }
}
