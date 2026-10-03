package com.tracker.leetcode.tracker.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

@Slf4j
@Service
public class RedisDistributedLockService {

    private static final String LOCK_PREFIX = "lock:";
    private static final String UNLOCK_LUA_SCRIPT =
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";

    private final StringRedisTemplate stringRedisTemplate;
    private final DefaultRedisScript<Long> unlockScript;

    // Resilient fallback in-memory lock pool
    private final Map<String, ReentrantLock> localLockMap = new ConcurrentHashMap<>();

    public RedisDistributedLockService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.unlockScript = new DefaultRedisScript<>(UNLOCK_LUA_SCRIPT, Long.class);
    }

    /**
     * Attempts to acquire a distributed lock with a lease expiration.
     *
     * @param lockKey   unique resource identifier
     * @param lockValue unique token identifying the lock owner
     * @param leaseTime how long the lock should be held before auto-expiring
     * @return true if the lock was acquired, false otherwise
     */
    public boolean tryLock(String lockKey, String lockValue, Duration leaseTime) {
        String fullKey = LOCK_PREFIX + lockKey;
        try {
            Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(fullKey, lockValue, leaseTime);
            return Boolean.TRUE.equals(acquired);
        } catch (Exception ex) {
            log.warn("Redis unavailable during tryLock for key [{}]. Falling back to local lock: {}",
                    lockKey, ex.getMessage());
            ReentrantLock localLock = localLockMap.computeIfAbsent(lockKey, k -> new ReentrantLock());
            return localLock.tryLock();
        }
    }

    /**
     * Releases the lock safely using an atomic Lua script if the caller owns the lock.
     *
     * @param lockKey   resource identifier
     * @param lockValue unique token identifying the lock owner
     */
    public void unlock(String lockKey, String lockValue) {
        String fullKey = LOCK_PREFIX + lockKey;
        try {
            Long result = stringRedisTemplate.execute(
                    unlockScript,
                    Collections.singletonList(fullKey),
                    lockValue
            );
            if (result != null && result > 0) {
                log.debug("Successfully released distributed lock for key [{}]", lockKey);
            } else {
                log.debug("Lock key [{}] was already expired or owned by another process", lockKey);
            }
        } catch (Exception ex) {
            log.warn("Redis unavailable during unlock for key [{}]. Releasing local lock: {}",
                    lockKey, ex.getMessage());
            ReentrantLock localLock = localLockMap.get(lockKey);
            if (localLock != null && localLock.isHeldByCurrentThread()) {
                localLock.unlock();
            }
        }
    }

    /**
     * Executes a task only if the distributed lock can be acquired.
     * If acquired, executes the task and guarantees lock release.
     *
     * @param lockKey   resource identifier
     * @param leaseTime maximum duration to hold the lock
     * @param task      task to execute
     * @param <T>       return type
     * @return Optional containing the result, or Optional.empty() if lock could not be acquired
     */
    public <T> Optional<T> executeWithLock(String lockKey, Duration leaseTime, Supplier<T> task) {
        String lockValue = UUID.randomUUID().toString();
        boolean locked = tryLock(lockKey, lockValue, leaseTime);
        if (!locked) {
            log.info("Could not acquire distributed lock for key [{}] - skipping duplicate execution", lockKey);
            return Optional.empty();
        }

        try {
            return Optional.ofNullable(task.get());
        } finally {
            unlock(lockKey, lockValue);
        }
    }

    /**
     * Executes a runnable task only if the lock can be acquired.
     *
     * @return true if executed, false if skipped due to concurrency lock
     */
    public boolean executeWithLockOrSkip(String lockKey, Duration leaseTime, Runnable task) {
        String lockValue = UUID.randomUUID().toString();
        boolean locked = tryLock(lockKey, lockValue, leaseTime);
        if (!locked) {
            log.info("Could not acquire distributed lock for key [{}] - skipping execution", lockKey);
            return false;
        }

        try {
            task.run();
            return true;
        } finally {
            unlock(lockKey, lockValue);
        }
    }
}
