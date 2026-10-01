package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Service.RateLimitingService.RateLimitResult;
import com.tracker.leetcode.tracker.Service.RateLimitingService.Tier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitingServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService = new RateLimitingService(stringRedisTemplate);
    }

    @Test
    void checkLimit_WhenWithinLimit_ShouldAllowRequest() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(3L);
        when(stringRedisTemplate.getExpire(anyString(), eq(TimeUnit.SECONDS))).thenReturn(55L);

        RateLimitResult result = rateLimitingService.checkLimit("192.168.1.1", Tier.AUTH);

        assertTrue(result.isAllowed());
        assertEquals(10L, result.getLimit());
        assertEquals(7L, result.getRemaining());
        assertEquals(55L, result.getResetSeconds());
    }

    @Test
    void checkLimit_WhenExceedingLimit_ShouldRejectRequest() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(11L);
        when(stringRedisTemplate.getExpire(anyString(), eq(TimeUnit.SECONDS))).thenReturn(30L);

        RateLimitResult result = rateLimitingService.checkLimit("192.168.1.1", Tier.AUTH);

        assertFalse(result.isAllowed());
        assertEquals(10L, result.getLimit());
        assertEquals(0L, result.getRemaining());
        assertEquals(30L, result.getResetSeconds());
    }

    @Test
    void checkLimit_WhenRedisFails_ShouldFallbackToInMemoryGracefully() {
        when(stringRedisTemplate.opsForValue()).thenThrow(new RedisConnectionFailureException("Redis connection refused"));

        // First request should succeed via in-memory store
        RateLimitResult result1 = rateLimitingService.checkLimit("fallback-client-1", Tier.GENERAL);
        assertTrue(result1.isAllowed());
        assertEquals(60L, result1.getLimit());
        assertEquals(59L, result1.getRemaining());

        // Subsequent requests continue counting locally
        RateLimitResult result2 = rateLimitingService.checkLimit("fallback-client-1", Tier.GENERAL);
        assertTrue(result2.isAllowed());
        assertEquals(58L, result2.getRemaining());
    }

    @Test
    void tierLimits_ShouldHaveConfiguredDefaults() {
        assertEquals(10L, rateLimitingService.getLimitForTier(Tier.AUTH));
        assertEquals(12L, rateLimitingService.getLimitForTier(Tier.LEETCODE_SYNC));
        assertEquals(60L, rateLimitingService.getLimitForTier(Tier.GENERAL));
    }
}
