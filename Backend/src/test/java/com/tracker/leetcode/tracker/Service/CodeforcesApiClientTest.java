package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.CodeforcesApiException;
import com.tracker.leetcode.tracker.Models.CodeforcesContestHistory;
import com.tracker.leetcode.tracker.Models.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeforcesApiClientTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private CodeforcesApiClient client;

    @BeforeEach
    void setUp() {
        client = new CodeforcesApiClient(redisTemplate);
    }

    @Test
    void normalizeProblemIdentifier_ShouldStripSlashesAndDashes() {
        assertEquals("4A", CodeforcesApiClient.normalizeProblemIdentifier("4/A"));
        assertEquals("4A", CodeforcesApiClient.normalizeProblemIdentifier("4-A"));
        assertEquals("1234B", CodeforcesApiClient.normalizeProblemIdentifier("1234b"));
        assertEquals("", CodeforcesApiClient.normalizeProblemIdentifier(null));
    }

    @Test
    void fetchUserInfo_WhenHandleIsBlank_ShouldReturnEmptyStudent() {
        Student result = client.fetchUserInfo("  ");
        assertNotNull(result);
        assertNull(result.getCodeforcesHandle());
    }

    @Test
    void fetchUserInfoFallback_WhenCachedExists_ShouldReturnCachedData() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Student cached = new Student();
        cached.setCodeforcesHandle("tourist");
        cached.setCodeforcesRating(3800);
        when(valueOperations.get("codeforces:profile:tourist")).thenReturn(cached);

        Student result = client.fetchUserInfoFallback("tourist", new RuntimeException("API down"));
        assertNotNull(result);
        assertEquals("tourist", result.getCodeforcesHandle());
        assertEquals(3800, result.getCodeforcesRating());
    }

    @Test
    void fetchUserInfoFallback_WhenNoCache_ShouldThrowCodeforcesApiException() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        assertThrows(CodeforcesApiException.class, () ->
                client.fetchUserInfoFallback("unknown_handle", new RuntimeException("Timeout")));
    }

    @Test
    void fetchContestHistory_WhenHandleIsBlank_ShouldReturnEmptyList() {
        List<CodeforcesContestHistory> list = client.fetchContestHistory("");
        assertTrue(list.isEmpty());
    }
}
