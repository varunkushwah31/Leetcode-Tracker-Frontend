package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.DailyChallengeDTO;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.RecentSubmission;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyChallengeService {

    private final LeetCodeApiClient leetCodeApiClient;
    private final StudentRepository studentRepository;
    private final ClassroomRepository classroomRepository;
    private final CacheManager cacheManager;

    /**
     * Retrieves the globally cached LeetCode Daily Challenge.
     * Cached globally in Redis under "global-potd" with key "today" (TTL: 24 hours).
     * Shared identically across all students and mentors without user-level computation.
     */
    @Cacheable(value = "global-potd", key = "'today'")
    public DailyChallengeDTO getGlobalDailyChallenge() {
        if (cacheManager != null) {
            Cache cache = cacheManager.getCache("global-potd");
            if (cache != null) {
                DailyChallengeDTO cached = cache.get("today", DailyChallengeDTO.class);
                if (cached != null) {
                    log.debug("Global POTD cache HIT for today.");
                    return cached;
                }
            }
        }

        log.info("Global POTD cache MISS. Querying upstream LeetCode API...");
        LeetCodeApiClient.LeetCodeDailyQuestion lcPotd = leetCodeApiClient.fetchDailyCodingChallenge();
        String today = LocalDate.now(ZoneId.of("UTC")).toString();

        DailyChallengeDTO challenge = DailyChallengeDTO.builder()
                .date(today)
                // Official LeetCode POTD info
                .leetcodeFrontendId(lcPotd.questionFrontendId())
                .leetcodeTitle(lcPotd.title())
                .leetcodeTitleSlug(lcPotd.titleSlug())
                .leetcodeDifficulty(lcPotd.difficulty())
                .leetcodeUrl(lcPotd.url())
                .leetcodeTopicTags(lcPotd.topicTags())
                .userSolvedLeetcode(false)
                .userSolved(false)
                .build();

        if (cacheManager != null) {
            Cache cache = cacheManager.getCache("global-potd");
            if (cache != null) {
                cache.put("today", challenge);
                log.info("Cached global POTD in Redis under 'global-potd::today'.");
            }
        }

        return challenge;
    }

    /**
     * Retrieves daily challenge for a student, building on top of the globally cached POTD.
     * The upstream POTD challenge metadata is fetched 0ms from the global Redis cache.
     */
    public DailyChallengeDTO getDailyChallenge(String studentIdentifier, String classroomId) {
        DailyChallengeDTO globalPotd = getGlobalDailyChallenge();
        if (globalPotd == null) {
            return null;
        }

        // If no user context or classroom requested, return the global cached POTD directly
        if ((studentIdentifier == null || studentIdentifier.isBlank()) &&
                (classroomId == null || classroomId.isBlank())) {
            return globalPotd;
        }

        DailyChallengeDTO.DailyChallengeDTOBuilder builder = globalPotd.toBuilder();

        Student student = resolveStudent(studentIdentifier);
        boolean solvedLc = false;

        if (student != null) {
            solvedLc = hasSolvedLeetcodeChallenge(student, globalPotd.getLeetcodeTitleSlug(), globalPotd.getLeetcodeTitle());
            builder.userSolvedLeetcode(solvedLc);
            builder.userSolved(solvedLc);
        }

        // Determine classroom for ticker
        Classroom classroom = resolveClassroom(student, classroomId);
        if (classroom != null && classroom.getStudentIds() != null && !classroom.getStudentIds().isEmpty()) {
            List<Student> classmates = studentRepository.findAllById(classroom.getStudentIds());
            int total = classmates.size();
            int solvedCount = 0;

            for (Student s : classmates) {
                if (hasSolvedLeetcodeChallenge(s, globalPotd.getLeetcodeTitleSlug(), globalPotd.getLeetcodeTitle())) {
                    solvedCount++;
                }
            }

            builder.classroomName(classroom.getClassName());
            builder.classroomTotalStudents(total);
            builder.classroomSolvedCount(solvedCount);
            builder.classroomSolvedPercentage(total > 0 ? Math.round(((double) solvedCount / total) * 1000.0) / 10.0 : 0.0);
        }

        return builder.build();
    }

    private Student resolveStudent(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        return studentRepository.findById(identifier)
                .or(() -> studentRepository.findByEmail(identifier))
                .or(() -> studentRepository.findByLeetcodeUsername(identifier))
                .or(() -> studentRepository.findByCodeforcesHandle(identifier))
                .orElse(null);
    }

    private Classroom resolveClassroom(Student student, String classroomId) {
        if (classroomId != null && !classroomId.isBlank()) {
            return classroomRepository.findById(classroomId).orElse(null);
        }
        if (student != null && student.getId() != null) {
            List<Classroom> classrooms = classroomRepository.findByStudentIdsContaining(student.getId());
            if (!classrooms.isEmpty()) {
                return classrooms.get(0);
            }
        }
        return null;
    }

    private boolean hasSolvedLeetcodeChallenge(Student s, String titleSlug, String title) {
        if (s == null || s.getRecentSubmissions() == null) return false;
        String cleanSlug = titleSlug != null ? titleSlug.trim().toLowerCase() : "";
        String cleanTitle = title != null ? title.trim().toLowerCase() : "";

        for (RecentSubmission sub : s.getRecentSubmissions()) {
            if (sub.getPlatform() == null || sub.getPlatform() == com.tracker.leetcode.tracker.Models.Platform.LEETCODE) {
                String subSlug = sub.getTitleSlug() != null ? sub.getTitleSlug().trim().toLowerCase() : "";
                String subTitle = sub.getTitle() != null ? sub.getTitle().trim().toLowerCase() : "";
                if ((!cleanSlug.isEmpty() && cleanSlug.equalsIgnoreCase(subSlug)) ||
                        (!cleanTitle.isEmpty() && cleanTitle.equalsIgnoreCase(subTitle))) {
                    return true;
                }
            }
        }
        return false;
    }
}
