package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.UpcomingContestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContestScheduleServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    private ContestScheduleService contestScheduleService;

    @BeforeEach
    void setUp() {
        contestScheduleService = new ContestScheduleService(
                redisTemplate,
                cacheManager
        );
    }

    @Test
    @DisplayName("getUpcomingContests returns cached list on cache hit without recalculating")
    void getUpcomingContests_CacheHit_ReturnsCached() {
        when(cacheManager.getCache("upcoming-contests")).thenReturn(cache);
        List<UpcomingContestDTO> cached = List.of(
                UpcomingContestDTO.builder().id("LC-1").platform("LEETCODE").title("Weekly Contest 420").build(),
                UpcomingContestDTO.builder().id("CF-1").platform("CODEFORCES").title("Codeforces Round 990").build()
        );
        when(cache.get("ALL", List.class)).thenReturn(cached);

        List<UpcomingContestDTO> result = contestScheduleService.getUpcomingContests("ALL");

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("LC-1", result.get(0).getId());
    }

    @Test
    @DisplayName("getUpcomingContests calculates and populates global caches on cache miss")
    void getUpcomingContests_CacheMiss_CalculatesAndPopulatesCache() {
        when(cacheManager.getCache("upcoming-contests")).thenReturn(cache);
        when(cache.get("ALL", List.class)).thenReturn(null);

        List<UpcomingContestDTO> result = contestScheduleService.getUpcomingContests("ALL");

        assertNotNull(result);
        assertFalse(result.isEmpty());
        // Verify it populates ALL, LEETCODE, and CODEFORCES in the global cache
        verify(cache).put(eq("ALL"), anyList());
        verify(cache).put(eq("LEETCODE"), anyList());
        verify(cache).put(eq("CODEFORCES"), anyList());
    }

    @Test
    @DisplayName("getUpcomingContests filters by platform correctly")
    void getUpcomingContests_PlatformFilter_FiltersProperly() {
        when(cacheManager.getCache("upcoming-contests")).thenReturn(cache);
        when(cache.get("LEETCODE", List.class)).thenReturn(null);

        List<UpcomingContestDTO> result = contestScheduleService.getUpcomingContests("LEETCODE");

        assertNotNull(result);
        assertTrue(result.stream().allMatch(c -> "LEETCODE".equalsIgnoreCase(c.getPlatform())));
    }
}
