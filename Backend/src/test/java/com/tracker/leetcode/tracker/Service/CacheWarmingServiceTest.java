package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.MentorDTO;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CacheWarmingServiceTest {

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private ClassroomService classroomService;

    @Mock
    private MentorService mentorService;

    @Mock
    private DailyChallengeService dailyChallengeService;

    @Mock
    private ContestScheduleService contestScheduleService;

    @Mock
    private RedisDistributedLockService lockService;

    private CacheWarmingService cacheWarmingService;

    @BeforeEach
    void setUp() {
        cacheWarmingService = new CacheWarmingService(
                classroomRepository,
                mentorRepository,
                classroomService,
                mentorService,
                dailyChallengeService,
                contestScheduleService,
                lockService
        );
    }

    @Test
    @DisplayName("warmAllCaches refreshes global POTD and upcoming contests and primes classroom and mentor caches")
    void warmAllCaches_RefreshesPotdAndContests() {
        Classroom classroom = new Classroom();
        classroom.setId("class-1");
        when(classroomRepository.findAll()).thenReturn(List.of(classroom));

        MentorDTO mentor = MentorDTO.builder().id("m-1").name("Mentor One").build();
        when(mentorService.getAllMentors()).thenReturn(List.of(mentor));

        Map<String, Object> result = cacheWarmingService.warmAllCaches();

        assertNotNull(result);
        assertEquals("SUCCESS", result.get("status"));
        assertEquals(1, result.get("classroomsWarmed"));
        assertEquals(1, result.get("mentorsWarmed"));

        verify(dailyChallengeService).refreshGlobalDailyChallenge();
        verify(contestScheduleService).refreshUpcomingContests();
        verify(classroomService).getClassroomDashboard("class-1", "name");
        verify(mentorService).getMentorById("m-1");
    }

    @Test
    @DisplayName("scheduledCacheWarming invokes distributed lock service with 30m lease")
    void scheduledCacheWarming_InvokesLockService() {
        when(lockService.executeWithLockOrSkip(eq("lock:cache-warming"), eq(Duration.ofMinutes(30)), any(Runnable.class)))
                .thenAnswer(invocation -> {
                    Runnable task = invocation.getArgument(2);
                    task.run();
                    return true;
                });

        cacheWarmingService.scheduledCacheWarming();

        verify(lockService).executeWithLockOrSkip(eq("lock:cache-warming"), eq(Duration.ofMinutes(30)), any(Runnable.class));
        verify(dailyChallengeService).refreshGlobalDailyChallenge();
        verify(contestScheduleService).refreshUpcomingContests();
    }
}
