package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Date;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class TokenBlacklistService {

    private static final String TOKEN_BLACKLIST_PREFIX = "blacklist:jwt:";
    private static final String USER_BLACKLIST_PREFIX = "blacklist:user:";

    private final StringRedisTemplate stringRedisTemplate;
    private final JwtService jwtService;

    // Resilient in-memory fallback store if Redis becomes temporarily unavailable
    private final Map<String, Long> inMemoryTokenBlacklist = new ConcurrentHashMap<>();
    private final Map<String, Long> inMemoryUserBlacklist = new ConcurrentHashMap<>();

    public TokenBlacklistService(StringRedisTemplate stringRedisTemplate, JwtService jwtService) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.jwtService = jwtService;
    }

    /**
     * Blacklists a specific JWT token until its expiration time.
     */
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        Date expiration;
        try {
            expiration = jwtService.extractExpiration(cleanToken);
        } catch (Exception e) {
            log.warn("Cannot extract expiration for token blacklist: {}", e.getMessage());
            return;
        }

        if (expiration == null) {
            return;
        }

        long remainingMillis = expiration.getTime() - System.currentTimeMillis();
        if (remainingMillis <= 0) {
            return; // Token has already expired
        }

        String tokenHash = hashToken(cleanToken);
        String redisKey = TOKEN_BLACKLIST_PREFIX + tokenHash;

        try {
            stringRedisTemplate.opsForValue().set(redisKey, "revoked", remainingMillis, TimeUnit.MILLISECONDS);
            log.info("JWT token successfully blacklisted in Redis for {} ms (hash: {})", remainingMillis, tokenHash);
        } catch (Exception ex) {
            log.warn("Redis unavailable while blacklisting token. Using in-memory fallback store: {}", ex.getMessage());
            inMemoryTokenBlacklist.put(tokenHash, expiration.getTime());
        }
    }

    /**
     * Checks if a JWT token is blacklisted.
     */
    public boolean isTokenBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        String tokenHash = hashToken(cleanToken);
        String redisKey = TOKEN_BLACKLIST_PREFIX + tokenHash;

        try {
            Boolean hasKey = stringRedisTemplate.hasKey(redisKey);
            if (Boolean.TRUE.equals(hasKey)) {
                return true;
            }
        } catch (Exception ex) {
            log.warn("Redis unavailable during token blacklist check. Falling back to in-memory store: {}", ex.getMessage());
        }

        // Check fallback store
        Long exp = inMemoryTokenBlacklist.get(tokenHash);
        if (exp != null) {
            if (System.currentTimeMillis() < exp) {
                return true;
            } else {
                inMemoryTokenBlacklist.remove(tokenHash);
            }
        }

        return false;
    }

    /**
     * Revokes all active tokens for a specific user ID for a specified duration.
     */
    public void blacklistUser(String userId, Duration duration) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        String redisKey = USER_BLACKLIST_PREFIX + userId.trim();
        long revocationTimestamp = System.currentTimeMillis();

        try {
            stringRedisTemplate.opsForValue().set(redisKey, String.valueOf(revocationTimestamp), duration);
            log.info("User [{}] tokens revoked in Redis for duration: {}", userId, duration);
        } catch (Exception ex) {
            log.warn("Redis unavailable for user blacklist. Falling back to in-memory: {}", ex.getMessage());
            inMemoryUserBlacklist.put(userId.trim(), revocationTimestamp + duration.toMillis());
        }
    }

    /**
     * Checks if a user has been globally revoked after the token's issuedAt timestamp.
     */
    public boolean isUserRevoked(String userId, Date issuedAt) {
        if (userId == null || userId.isBlank() || issuedAt == null) {
            return false;
        }

        String redisKey = USER_BLACKLIST_PREFIX + userId.trim();
        try {
            String revocationTimeStr = stringRedisTemplate.opsForValue().get(redisKey);
            if (revocationTimeStr != null) {
                long revocationTime = Long.parseLong(revocationTimeStr);
                return issuedAt.getTime() <= revocationTime;
            }
        } catch (Exception ex) {
            log.warn("Redis unavailable during user revocation check: {}", ex.getMessage());
        }

        Long inMemoryExpiry = inMemoryUserBlacklist.get(userId.trim());
        if (inMemoryExpiry != null && System.currentTimeMillis() < inMemoryExpiry) {
            return true;
        }

        return false;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(token.hashCode());
        }
    }
}
