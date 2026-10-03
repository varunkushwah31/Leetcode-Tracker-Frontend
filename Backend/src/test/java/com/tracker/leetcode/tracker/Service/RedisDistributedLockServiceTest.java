package com.tracker.leetcode.tracker.Service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisDistributedLockServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RedisDistributedLockService lockService;

    @BeforeEach
    void setUp() {
        lockService = new RedisDistributedLockService(stringRedisTemplate);
    }

    @Test
    void tryLock_WhenRedisSetsKeySuccessfully_ShouldReturnTrue() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("lock:resource-1"), anyString(), eq(Duration.ofSeconds(30))))
                .thenReturn(true);

        boolean locked = lockService.tryLock("resource-1", "token-abc", Duration.ofSeconds(30));

        assertTrue(locked);
    }

    @Test
    void tryLock_WhenKeyAlreadyHeld_ShouldReturnFalse() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("lock:resource-1"), anyString(), eq(Duration.ofSeconds(30))))
                .thenReturn(false);

        boolean locked = lockService.tryLock("resource-1", "token-abc", Duration.ofSeconds(30));

        assertFalse(locked);
    }

    @Test
    void unlock_ShouldExecuteLuaScript() {
        when(stringRedisTemplate.execute(any(RedisScript.class), eq(List.of("lock:resource-1")), eq("token-abc")))
                .thenReturn(1L);

        lockService.unlock("resource-1", "token-abc");

        verify(stringRedisTemplate, times(1)).execute(any(RedisScript.class), eq(List.of("lock:resource-1")), eq("token-abc"));
    }

    @Test
    void executeWithLock_WhenLockAcquired_ShouldExecuteTaskAndUnlock() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(startsWith("lock:resource-1"), anyString(), any(Duration.class)))
                .thenReturn(true);
        when(stringRedisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenReturn(1L);

        Optional<String> result = lockService.executeWithLock("resource-1", Duration.ofSeconds(10), () -> "success");

        assertTrue(result.isPresent());
        assertEquals("success", result.get());
        verify(stringRedisTemplate, times(1)).execute(any(RedisScript.class), anyList(), anyString());
    }

    @Test
    void executeWithLock_WhenLockNotAcquired_ShouldReturnEmptyAndNotRunTask() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(startsWith("lock:resource-1"), anyString(), any(Duration.class)))
                .thenReturn(false);

        Optional<String> result = lockService.executeWithLock("resource-1", Duration.ofSeconds(10), () -> "success");

        assertTrue(result.isEmpty());
        verify(stringRedisTemplate, never()).execute(any(RedisScript.class), anyList(), anyString());
    }
}
