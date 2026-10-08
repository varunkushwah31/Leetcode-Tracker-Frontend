package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.DailyChallengeDTO;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.RecentSubmission;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyChallengeServiceTest {

    @Mock
    private LeetCodeApiClient leetCodeApiClient;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    private DailyChallengeService dailyChallengeService;

    @BeforeEach
    void setUp() {
        dailyChallengeService = new DailyChallengeService(
                leetCodeApiClient,
                studentRepository,
                classroomRepository,
                cacheManager
        );
    }

    @Test
    @DisplayName("getGlobalDailyChallenge returns cached challenge on cache hit without calling upstream API")
    void getGlobalDailyChallenge_CacheHit_ReturnsCached() {
        when(cacheManager.getCache("global-potd")).thenReturn(cache);
        DailyChallengeDTO cached = DailyChallengeDTO.builder()
                .date("2026-10-08")
                .leetcodeTitle("Number of Islands")
                .leetcodeTitleSlug("number-of-islands")
                .build();
        when(cache.get("today", DailyChallengeDTO.class)).thenReturn(cached);

        DailyChallengeDTO result = dailyChallengeService.getGlobalDailyChallenge();

        assertNotNull(result);
        assertEquals("Number of Islands", result.getLeetcodeTitle());
        verifyNoInteractions(leetCodeApiClient);
    }

    @Test
    @DisplayName("getGlobalDailyChallenge fetches from API and caches globally on cache miss")
    void getGlobalDailyChallenge_CacheMiss_FetchesAndCaches() {
        when(cacheManager.getCache("global-potd")).thenReturn(cache);
        when(cache.get("today", DailyChallengeDTO.class)).thenReturn(null);

        LeetCodeApiClient.LeetCodeDailyQuestion apiResponse = new LeetCodeApiClient.LeetCodeDailyQuestion(
                LocalDate.now(ZoneId.of("UTC")).toString(),
                "200",
                "Number of Islands",
                "number-of-islands",
                "Medium",
                "https://leetcode.com/problems/number-of-islands/",
                List.of("DFS", "BFS")
        );
        when(leetCodeApiClient.fetchDailyCodingChallenge()).thenReturn(apiResponse);

        DailyChallengeDTO result = dailyChallengeService.getGlobalDailyChallenge();

        assertNotNull(result);
        assertEquals("Number of Islands", result.getLeetcodeTitle());
        assertEquals("number-of-islands", result.getLeetcodeTitleSlug());
        verify(cache).put(eq("today"), any(DailyChallengeDTO.class));
    }

    @Test
    @DisplayName("getDailyChallenge with student context computes solved state and classroom ticker")
    void getDailyChallenge_WithStudentAndClassroom_DecoratesProperly() {
        when(cacheManager.getCache("global-potd")).thenReturn(cache);
        DailyChallengeDTO cached = DailyChallengeDTO.builder()
                .date("2026-10-08")
                .leetcodeTitle("Number of Islands")
                .leetcodeTitleSlug("number-of-islands")
                .leetcodeDifficulty("Medium")
                .build();
        when(cache.get("today", DailyChallengeDTO.class)).thenReturn(cached);

        Student student = new Student();
        student.setId("s1");
        student.setLeetcodeUsername("student1");
        RecentSubmission sub = new RecentSubmission();
        sub.setTitleSlug("number-of-islands");
        student.setRecentSubmissions(List.of(sub));

        Classroom classroom = new Classroom();
        classroom.setId("c1");
        classroom.setClassName("Batch A");
        classroom.setStudentIds(List.of("s1"));

        when(studentRepository.findById("student1")).thenReturn(Optional.of(student));
        when(classroomRepository.findById("c1")).thenReturn(Optional.of(classroom));
        when(studentRepository.findAllById(List.of("s1"))).thenReturn(List.of(student));

        DailyChallengeDTO result = dailyChallengeService.getDailyChallenge("student1", "c1");

        assertNotNull(result);
        assertTrue(result.isUserSolvedLeetcode());
        assertEquals("Batch A", result.getClassroomName());
        assertEquals(1, result.getClassroomTotalStudents());
        assertEquals(1, result.getClassroomSolvedCount());
        assertEquals(100.0, result.getClassroomSolvedPercentage());
    }

    @Test
    @DisplayName("getDailyChallenge uses cached classroom ticker on cache hit without querying studentRepository.findAllById")
    void getDailyChallenge_ClassroomTickerCacheHit_UsesCache() {
        when(cacheManager.getCache("global-potd")).thenReturn(cache);
        DailyChallengeDTO cached = DailyChallengeDTO.builder()
                .date("2026-10-08")
                .leetcodeTitle("Number of Islands")
                .leetcodeTitleSlug("number-of-islands")
                .build();
        when(cache.get("today", DailyChallengeDTO.class)).thenReturn(cached);

        Student student = new Student();
        student.setId("s1");
        student.setLeetcodeUsername("student1");

        Classroom classroom = new Classroom();
        classroom.setId("c1");
        classroom.setClassName("Batch A");
        classroom.setStudentIds(List.of("s1", "s2"));

        when(studentRepository.findById("student1")).thenReturn(Optional.of(student));
        when(classroomRepository.findById("c1")).thenReturn(Optional.of(classroom));

        Cache tickerCache = mock(Cache.class);
        when(cacheManager.getCache("classroom-potd-ticker")).thenReturn(tickerCache);
        DailyChallengeService.ClassroomPotdTicker cachedTicker = new DailyChallengeService.ClassroomPotdTicker(
                "Batch A", 2, 2, 100.0
        );
        when(tickerCache.get("c1:number-of-islands", DailyChallengeService.ClassroomPotdTicker.class)).thenReturn(cachedTicker);

        DailyChallengeDTO result = dailyChallengeService.getDailyChallenge("student1", "c1");

        assertNotNull(result);
        assertEquals("Batch A", result.getClassroomName());
        assertEquals(2, result.getClassroomTotalStudents());
        assertEquals(2, result.getClassroomSolvedCount());
        assertEquals(100.0, result.getClassroomSolvedPercentage());

        // Verify findAllById was NEVER called because ticker was loaded directly from cache!
        verify(studentRepository, never()).findAllById(anyList());
    }
}
