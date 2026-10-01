package com.tracker.leetcode.tracker.Service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RateLimitingService {

    public enum Tier {
        AUTH,
        LEETCODE_SYNC,
        GENERAL
    }

    @Getter
    @AllArgsConstructor
    public static class RateLimitResult {
        private final boolean allowed;
        private final long limit;
        private final long remaining;
        private final long resetSeconds;
    }

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${application.rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled = true;

    @Value("${application.rate-limiting.auth.limit:10}")
    private long authLimit = 10;

    @Value("${application.rate-limiting.auth.duration-seconds:60}")
    private long authDurationSeconds = 60;

    @Value("${application.rate-limiting.sync.limit:12}")
    private long syncLimit = 12;

    @Value("${application.rate-limiting.sync.duration-seconds:60}")
    private long syncDurationSeconds = 60;

    @Value("${application.rate-limiting.general.limit:60}")
    private long generalLimit = 60;

    @Value("${application.rate-limiting.general.duration-seconds:60}")
    private long generalDurationSeconds = 60;

    // Resilient in-memory fallback store if Redis becomes temporarily unavailable
    private final Map<String, InMemoryCounter> inMemoryStore = new ConcurrentHashMap<>();

    private static class InMemoryCounter {
        long count;
        long windowStart;

        InMemoryCounter(long windowStart) {
            this.count = 1;
            this.windowStart = windowStart;
        }
    }

    public RateLimitingService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public RateLimitResult checkLimit(String clientIdentifier, Tier tier) {
        if (!rateLimitingEnabled) {
            return new RateLimitResult(true, 1000, 1000, 0);
        }

        long maxLimit = getLimitForTier(tier);
        long durationSeconds = getDurationForTier(tier);
        String redisKey = "ratelimit:" + tier.name() + ":" + clientIdentifier;

        try {
            return checkRedisLimit(redisKey, maxLimit, durationSeconds);
        } catch (Exception ex) {
            log.warn("Redis unavailable for rate limiting ({}: {}). Falling back to in-memory counter.",
                    ex.getClass().getSimpleName(), ex.getMessage());
            return checkInMemoryLimit(redisKey, maxLimit, durationSeconds);
        }
    }

    private RateLimitResult checkRedisLimit(String key, long maxLimit, long durationSeconds) {
        Long currentCount = stringRedisTemplate.opsForValue().increment(key);
        if (currentCount == null) {
            currentCount = 1L;
        }

        if (currentCount == 1) {
            stringRedisTemplate.expire(key, Duration.ofSeconds(durationSeconds));
        }

        Long ttl = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);
        if (ttl == null || ttl < 0) {
            stringRedisTemplate.expire(key, Duration.ofSeconds(durationSeconds));
            ttl = durationSeconds;
        }

        boolean allowed = currentCount <= maxLimit;
        long remaining = Math.max(0, maxLimit - currentCount);
        return new RateLimitResult(allowed, maxLimit, remaining, ttl);
    }

    private synchronized RateLimitResult checkInMemoryLimit(String key, long maxLimit, long durationSeconds) {
        long now = System.currentTimeMillis();
        long windowDurationMs = durationSeconds * 1000L;

        InMemoryCounter counter = inMemoryStore.get(key);
        if (counter == null || (now - counter.windowStart) >= windowDurationMs) {
            inMemoryStore.put(key, new InMemoryCounter(now));
            return new RateLimitResult(true, maxLimit, maxLimit - 1, durationSeconds);
        }

        counter.count++;
        long elapsed = now - counter.windowStart;
        long remainingSeconds = Math.max(1, (windowDurationMs - elapsed) / 1000L);

        boolean allowed = counter.count <= maxLimit;
        long remaining = Math.max(0, maxLimit - counter.count);
        return new RateLimitResult(allowed, maxLimit, remaining, remainingSeconds);
    }

    public long getLimitForTier(Tier tier) {
        return switch (tier) {
            case AUTH -> authLimit;
            case LEETCODE_SYNC -> syncLimit;
            case GENERAL -> generalLimit;
        };
    }

    public long getDurationForTier(Tier tier) {
        return switch (tier) {
            case AUTH -> authDurationSeconds;
            case LEETCODE_SYNC -> syncDurationSeconds;
            case GENERAL -> generalDurationSeconds;
        };
    }
}
