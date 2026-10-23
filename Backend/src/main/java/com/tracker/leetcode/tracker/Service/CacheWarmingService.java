package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.MentorDTO;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheWarmingService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomService classroomService;
    private final MentorService mentorService;
    private final DailyChallengeService dailyChallengeService;
    private final ContestScheduleService contestScheduleService;
    private final RedisDistributedLockService lockService;

    /**
     * Daily Cache Warming & Global POTD / Contest Sync scheduled everyday at 6:00 AM Indian Standard Time (IST).
     * Protected by Redis distributed lock to avoid redundant runs across cluster replicas.
     */
    @Scheduled(cron = "${app.cache-warming.cron:0 0 6 * * ?}", zone = "${app.cache-warming.zone:Asia/Kolkata}")
    public void scheduledCacheWarming() {
        log.info("Initiating scheduled 6:00 AM IST Redis Cache Warming & POTD/Contest sync worker...");
        boolean executed = lockService.executeWithLockOrSkip("lock:cache-warming", Duration.ofMinutes(30), this::warmAllCaches);
        if (!executed) {
            log.info("Redis Cache Warming skipped - distributed lock held by another cluster instance.");
        }
    }

    /**
     * Pre-fetches and primes all hot caches so mentors and students experience
     * 0ms cache hits without cold-cache latency.
     */
    public Map<String, Object> warmAllCaches() {
        long startTime = System.currentTimeMillis();
        int classroomsWarmed = 0;
        int mentorsWarmed = 0;

        log.info("Executing comprehensive Redis Cache Warming worker (6:00 AM IST sync)...");

        // 1. Force Refresh Global POTD & Upcoming Contests
        try {
            dailyChallengeService.refreshGlobalDailyChallenge();
            log.info("Global POTD refreshed and primed successfully in Redis.");
        } catch (Exception e) {
            log.warn("Cache warming global POTD failed: {}", e.getMessage());
        }

        try {
            contestScheduleService.refreshUpcomingContests();
            log.info("Global upcoming contests refreshed and primed successfully in Redis.");
        } catch (Exception e) {
            log.warn("Cache warming global Contests failed: {}", e.getMessage());
        }

        // 2. Warm Classrooms (Dashboards and Analytics)
        try {
            List<Classroom> classrooms = classroomRepository.findAll();
            for (Classroom c : classrooms) {
                if (warmClassroom(c)) {
                    classroomsWarmed++;
                }
            }
        } catch (Exception e) {
            log.warn("Error fetching classrooms for cache warming: {}", e.getMessage());
        }

        // 3. Warm Mentors
        try {
            List<MentorDTO> mentors = mentorService.getAllMentors();
            for (MentorDTO m : mentors) {
                if (warmMentor(m)) {
                    mentorsWarmed++;
                }
            }
        } catch (Exception e) {
            log.warn("Error warming mentors list: {}", e.getMessage());
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("Redis Cache Warming completed in {}ms: {} classrooms, {} mentors warmed.",
                duration, classroomsWarmed, mentorsWarmed);

        Map<String, Object> report = new HashMap<>();
        report.put("status", "SUCCESS");
        report.put("durationMs", duration);
        report.put("classroomsWarmed", classroomsWarmed);
        report.put("mentorsWarmed", mentorsWarmed);
        report.put("potdWarmed", true);
        report.put("contestsWarmed", true);
        return report;
    }

    private boolean warmClassroom(Classroom c) {
        try {
            classroomService.getClassroomDashboard(c.getId(), "name");
            classroomService.getClassroomDashboard(c.getId(), "problemsSolved");
            classroomService.getClassroomDashboard(c.getId(), "contestRating");
            classroomService.getClassroomAnalytics(c.getId());
            return true;
        } catch (Exception e) {
            log.warn("Cache warming failed for classroom {}: {}", c.getId(), e.getMessage());
            return false;
        }
    }

    private boolean warmMentor(MentorDTO m) {
        try {
            mentorService.getMentorById(m.getId());
            return true;
        } catch (Exception e) {
            log.warn("Cache warming failed for mentor {}: {}", m.getId(), e.getMessage());
            return false;
        }
    }
}
