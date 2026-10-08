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

import org.springframework.web.client.RestTemplate;
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

    @Test
    void fetchSubmissions_WhenHandleIsBlank_ShouldReturnZeroSolved() {
        CodeforcesApiClient.CodeforcesSubmissionData data = client.fetchSubmissions("");
        assertNotNull(data);
        assertEquals(0, data.solvedCount());
        assertTrue(data.recentSubmissions().isEmpty());
    }

    @Test
    void fetchSubmissions_WhenHandleIsValid_ShouldQueryWithoutCountLimitAndCountUniqueSolves() {
        RestTemplate mockRestTemplate = mock(RestTemplate.class);
        CodeforcesApiClient customClient = new CodeforcesApiClient(redisTemplate, mockRestTemplate);

        String sampleJsonResponse = """
            {
              "status": "OK",
              "result": [
                {
                  "id": 101,
                  "contestId": 1,
                  "creationTimeSeconds": 1700000000,
                  "verdict": "OK",
                  "problem": { "contestId": 1, "index": "A", "name": "Theatre Square", "tags": ["math"] }
                },
                {
                  "id": 102,
                  "contestId": 1,
                  "creationTimeSeconds": 1700000010,
                  "verdict": "OK",
                  "problem": { "contestId": 1, "index": "A", "name": "Theatre Square", "tags": ["math"] }
                },
                {
                  "id": 103,
                  "contestId": 1,
                  "creationTimeSeconds": 1700000020,
                  "verdict": "WRONG_ANSWER",
                  "problem": { "contestId": 1, "index": "B", "name": "Spreadsheets", "tags": ["implementation"] }
                },
                {
                  "id": 104,
                  "contestId": 2,
                  "creationTimeSeconds": 1700000030,
                  "verdict": "OK",
                  "problem": { "contestId": 2, "index": "A", "name": "Winner", "tags": ["hashing"] }
                },
                {
                  "id": 105,
                  "creationTimeSeconds": 1700000040,
                  "verdict": "OK",
                  "problem": { "problemsetName": "acmsguru", "index": "100", "name": "A+B", "tags": ["math"] }
                }
              ]
            }
            """;

        when(mockRestTemplate.exchange(
                eq("https://codeforces.com/api/user.status?handle=test_cf"),
                eq(org.springframework.http.HttpMethod.GET),
                any(),
                eq(String.class)
        )).thenReturn(new org.springframework.http.ResponseEntity<>(sampleJsonResponse, org.springframework.http.HttpStatus.OK));

        CodeforcesApiClient.CodeforcesSubmissionData data = customClient.fetchSubmissions("test_cf");

        assertNotNull(data);
        // Unique solved: 1A, 2A, acmsguru_100 -> exactly 3 unique problems solved
        assertEquals(3, data.solvedCount());
        // Verify URL called was WITHOUT &from=1&count=500 limit
        verify(mockRestTemplate, times(1)).exchange(
                eq("https://codeforces.com/api/user.status?handle=test_cf"),
                eq(org.springframework.http.HttpMethod.GET),
                any(),
                eq(String.class)
        );
    }
}
