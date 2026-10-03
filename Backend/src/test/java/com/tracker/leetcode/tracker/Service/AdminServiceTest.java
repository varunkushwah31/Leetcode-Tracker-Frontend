package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisServerCommands;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private MentorService mentorService;

    @Mock
    private ClassroomService classroomService;

    @Mock
    private StudentService studentService;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private RedisConnectionFactory redisConnectionFactory;

    @Mock
    private RedisConnection redisConnection;

    @Mock
    private RedisServerCommands redisServerCommands;

    @Mock
    private Cache mockCache;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                studentRepository,
                mentorRepository,
                classroomRepository,
                mentorService,
                classroomService,
                studentService,
                cacheManager,
                stringRedisTemplate,
                redisConnectionFactory
        );
    }

    @Test
    void getCacheStats_WhenRedisConnected_ShouldReturnStatsMap() {
        when(redisConnectionFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.serverCommands()).thenReturn(redisServerCommands);

        Properties memoryProps = new Properties();
        memoryProps.setProperty("used_memory_human", "2.5M");
        memoryProps.setProperty("used_memory_peak_human", "5.0M");
        when(redisServerCommands.info("memory")).thenReturn(memoryProps);

        Properties serverProps = new Properties();
        serverProps.setProperty("redis_version", "7.0.0");
        serverProps.setProperty("uptime_in_seconds", "3600");
        when(redisServerCommands.info("server")).thenReturn(serverProps);

        when(cacheManager.getCacheNames()).thenReturn(List.of("classroom-dashboard", "student-stats"));
        when(stringRedisTemplate.keys(anyString())).thenReturn(Set.of("key1", "key2"));

        Map<String, Object> stats = adminService.getCacheStats();

        assertNotNull(stats);
        assertEquals("CONNECTED", stats.get("redisStatus"));
        assertEquals("2.5M", stats.get("usedMemoryHuman"));
        assertEquals("7.0.0", stats.get("redisVersion"));
        assertTrue(stats.containsKey("configuredCaches"));
        assertTrue(stats.containsKey("namespaceKeyCounts"));
    }

    @Test
    void clearCache_WhenAll_ShouldClearAllRegisteredCaches() {
        when(cacheManager.getCacheNames()).thenReturn(List.of("cache-1", "cache-2"));
        when(cacheManager.getCache("cache-1")).thenReturn(mockCache);
        when(cacheManager.getCache("cache-2")).thenReturn(mockCache);

        Map<String, String> response = adminService.clearCache("all");

        assertEquals("All caches successfully cleared.", response.get("message"));
        verify(mockCache, times(2)).clear();
    }

    @Test
    void clearCache_WhenSpecificCacheExists_ShouldClearIt() {
        when(cacheManager.getCache("cache-1")).thenReturn(mockCache);

        Map<String, String> response = adminService.clearCache("cache-1");

        assertEquals("Cache 'cache-1' successfully cleared.", response.get("message"));
        verify(mockCache, times(1)).clear();
    }

    @Test
    void clearCache_WhenCacheNotFound_ShouldReturnError() {
        when(cacheManager.getCache("non-existent")).thenReturn(null);

        Map<String, String> response = adminService.clearCache("non-existent");

        assertTrue(response.containsKey("error"));
        assertEquals("Cache 'non-existent' not found.", response.get("error"));
    }
}
