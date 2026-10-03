package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.LeaderboardEntryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.DefaultTypedTuple;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisLeaderboardServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private HashOperations<String, Object, Object> hashOperations;

    @Mock
    private ZSetOperations<String, String> zSetOperations;

    private RedisLeaderboardService leaderboardService;

    @BeforeEach
    void setUp() {
        leaderboardService = new RedisLeaderboardService(stringRedisTemplate);
    }

    @Test
    void updateStudentMetrics_WhenValidInput_ShouldUpdateHashesAndZSets() {
        when(stringRedisTemplate.opsForHash()).thenReturn(hashOperations);
        when(stringRedisTemplate.opsForZSet()).thenReturn(zSetOperations);

        leaderboardService.updateStudentMetrics(
                "student-1",
                "Alice",
                "alice_lc",
                "alice_cf",
                "https://avatar.png",
                120,
                1650.5,
                15,
                List.of("class-1")
        );

        verify(hashOperations, times(1)).putAll(eq("leaderboard:student-meta:student-1"), anyMap());
        verify(stringRedisTemplate, times(1)).expire(eq("leaderboard:student-meta:student-1"), any(Duration.class));

        // Global ZSet updates
        verify(zSetOperations, times(1)).add("leaderboard:global:solved", "student-1", 120.0);
        verify(zSetOperations, times(1)).add("leaderboard:global:rating", "student-1", 1650.5);
        verify(zSetOperations, times(1)).add("leaderboard:global:streak", "student-1", 15.0);

        // Classroom ZSet updates
        verify(zSetOperations, times(1)).add("leaderboard:classroom:class-1:solved", "student-1", 120.0);
        verify(zSetOperations, times(1)).add("leaderboard:classroom:class-1:rating", "student-1", 1650.5);
        verify(zSetOperations, times(1)).add("leaderboard:classroom:class-1:streak", "student-1", 15.0);
    }

    @Test
    void updateStudentMetrics_WhenStudentIdNull_ShouldDoNothing() {
        leaderboardService.updateStudentMetrics(null, "Bob", "bob", "bob", "", 0, 0, 0, null);
        verifyNoInteractions(stringRedisTemplate);
    }

    @Test
    void getLeaderboard_WhenResultsFound_ShouldReturnMappedEntries() {
        when(stringRedisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(stringRedisTemplate.opsForHash()).thenReturn(hashOperations);

        Set<ZSetOperations.TypedTuple<String>> scoredMembers = new LinkedHashSet<>();
        scoredMembers.add(new DefaultTypedTuple<>("student-1", 200.0));
        scoredMembers.add(new DefaultTypedTuple<>("student-2", 150.0));

        when(zSetOperations.reverseRangeWithScores("leaderboard:classroom:class-1:solved", 0, 9))
                .thenReturn(scoredMembers);

        Map<Object, Object> student1Meta = Map.of("name", "Alice", "lcUsername", "alice_lc", "cfHandle", "alice_cf");
        Map<Object, Object> student2Meta = Map.of("name", "Bob", "lcUsername", "bob_lc", "cfHandle", "bob_cf");

        when(hashOperations.entries("leaderboard:student-meta:student-1")).thenReturn(student1Meta);
        when(hashOperations.entries("leaderboard:student-meta:student-2")).thenReturn(student2Meta);

        List<LeaderboardEntryDTO> leaderboard = leaderboardService.getLeaderboard("class-1", "solved", 10);

        assertEquals(2, leaderboard.size());
        assertEquals("student-1", leaderboard.get(0).getStudentId());
        assertEquals(1, leaderboard.get(0).getRank());
        assertEquals(200.0, leaderboard.get(0).getScore());
        assertEquals("Alice", leaderboard.get(0).getName());

        assertEquals("student-2", leaderboard.get(1).getStudentId());
        assertEquals(2, leaderboard.get(1).getRank());
        assertEquals(150.0, leaderboard.get(1).getScore());
    }

    @Test
    void getLeaderboard_WhenEmpty_ShouldReturnEmptyList() {
        when(stringRedisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(zSetOperations.reverseRangeWithScores("leaderboard:global:solved", 0, 4))
                .thenReturn(Collections.emptySet());

        List<LeaderboardEntryDTO> leaderboard = leaderboardService.getLeaderboard(null, "solved", 5);

        assertNotNull(leaderboard);
        assertTrue(leaderboard.isEmpty());
    }

    @Test
    void getStudentRank_WhenRankExists_ShouldReturn1BasedRank() {
        when(stringRedisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(zSetOperations.reverseRank("leaderboard:classroom:class-1:rating", "student-1"))
                .thenReturn(0L);

        Optional<Long> rank = leaderboardService.getStudentRank("class-1", "rating", "student-1");

        assertTrue(rank.isPresent());
        assertEquals(1L, rank.get());
    }

    @Test
    void getStudentRank_WhenRankNotFound_ShouldReturnEmpty() {
        when(stringRedisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(zSetOperations.reverseRank("leaderboard:classroom:class-1:rating", "student-unknown"))
                .thenReturn(null);

        Optional<Long> rank = leaderboardService.getStudentRank("class-1", "rating", "student-unknown");

        assertTrue(rank.isEmpty());
    }

    @Test
    void removeStudentFromClassroom_ShouldRemoveFromAllMetricZSets() {
        when(stringRedisTemplate.opsForZSet()).thenReturn(zSetOperations);

        leaderboardService.removeStudentFromClassroom("class-1", "student-1");

        verify(zSetOperations).remove("leaderboard:classroom:class-1:solved", "student-1");
        verify(zSetOperations).remove("leaderboard:classroom:class-1:rating", "student-1");
        verify(zSetOperations).remove("leaderboard:classroom:class-1:streak", "student-1");
    }

    @Test
    void deleteClassroomLeaderboards_ShouldDeleteAllClassroomKeys() {
        leaderboardService.deleteClassroomLeaderboards("class-1");

        verify(stringRedisTemplate).delete(eq(List.of(
                "leaderboard:classroom:class-1:solved",
                "leaderboard:classroom:class-1:rating",
                "leaderboard:classroom:class-1:streak"
        )));
    }
}
