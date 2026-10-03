package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.LeaderboardEntryDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class RedisLeaderboardService {

    public static final String METRIC_SOLVED = "solved";
    public static final String METRIC_RATING = "rating";
    public static final String METRIC_STREAK = "streak";

    private static final String CLASSROOM_KEY_PREFIX = "leaderboard:classroom:";
    private static final String GLOBAL_KEY_PREFIX = "leaderboard:global:";
    private static final String STUDENT_META_PREFIX = "leaderboard:student-meta:";

    private final StringRedisTemplate stringRedisTemplate;

    public RedisLeaderboardService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * Updates student score metrics in Redis Sorted Sets for both global and classroom leaderboards.
     */
    public void updateStudentMetrics(
            String studentId,
            String name,
            String lcUsername,
            String cfHandle,
            String avatarUrl,
            int totalSolved,
            double contestRating,
            int consistencyStreak,
            List<String> classroomIds
    ) {
        if (studentId == null || studentId.isBlank()) {
            return;
        }

        try {
            // 1. Cache student metadata in a Redis Hash
            String metaKey = STUDENT_META_PREFIX + studentId;
            Map<String, String> metaMap = new HashMap<>();
            metaMap.put("name", name != null ? name : "Student");
            metaMap.put("lcUsername", lcUsername != null ? lcUsername : "");
            metaMap.put("cfHandle", cfHandle != null ? cfHandle : "");
            metaMap.put("avatarUrl", avatarUrl != null ? avatarUrl : "");
            stringRedisTemplate.opsForHash().putAll(metaKey, metaMap);
            stringRedisTemplate.expire(metaKey, Duration.ofDays(14));

            // 2. Update Global Leaderboards
            stringRedisTemplate.opsForZSet().add(GLOBAL_KEY_PREFIX + METRIC_SOLVED, studentId, totalSolved);
            stringRedisTemplate.opsForZSet().add(GLOBAL_KEY_PREFIX + METRIC_RATING, studentId, contestRating);
            stringRedisTemplate.opsForZSet().add(GLOBAL_KEY_PREFIX + METRIC_STREAK, studentId, consistencyStreak);

            // 3. Update Classroom Leaderboards
            if (classroomIds != null) {
                for (String cid : classroomIds) {
                    if (cid != null && !cid.isBlank()) {
                        stringRedisTemplate.opsForZSet().add(CLASSROOM_KEY_PREFIX + cid + ":" + METRIC_SOLVED, studentId, totalSolved);
                        stringRedisTemplate.opsForZSet().add(CLASSROOM_KEY_PREFIX + cid + ":" + METRIC_RATING, studentId, contestRating);
                        stringRedisTemplate.opsForZSet().add(CLASSROOM_KEY_PREFIX + cid + ":" + METRIC_STREAK, studentId, consistencyStreak);
                    }
                }
            }

            log.debug("Updated Redis leaderboards for student [{}] (solved: {}, rating: {}, streak: {})",
                    studentId, totalSolved, contestRating, consistencyStreak);
        } catch (Exception ex) {
            log.warn("Failed to update Redis leaderboards for student [{}]: {}", studentId, ex.getMessage());
        }
    }

    /**
     * Retrieves the top N students from a classroom or global leaderboard.
     */
    public List<LeaderboardEntryDTO> getLeaderboard(String classroomId, String metric, int limit) {
        String cleanMetric = normalizeMetric(metric);
        String zsetKey = (classroomId != null && !classroomId.isBlank())
                ? CLASSROOM_KEY_PREFIX + classroomId + ":" + cleanMetric
                : GLOBAL_KEY_PREFIX + cleanMetric;

        try {
            Set<ZSetOperations.TypedTuple<String>> scoredMembers =
                    stringRedisTemplate.opsForZSet().reverseRangeWithScores(zsetKey, 0, Math.max(0, limit - 1));

            if (scoredMembers == null || scoredMembers.isEmpty()) {
                return Collections.emptyList();
            }

            List<LeaderboardEntryDTO> entries = new ArrayList<>();
            long currentRank = 1;

            for (ZSetOperations.TypedTuple<String> tuple : scoredMembers) {
                String studentId = tuple.getValue();
                Double score = tuple.getScore();
                if (studentId == null) continue;

                // Fetch metadata
                String metaKey = STUDENT_META_PREFIX + studentId;
                Map<Object, Object> meta = stringRedisTemplate.opsForHash().entries(metaKey);

                String name = meta.get("name") != null ? meta.get("name").toString() : studentId;
                String lc = meta.get("lcUsername") != null ? meta.get("lcUsername").toString() : "";
                String cf = meta.get("cfHandle") != null ? meta.get("cfHandle").toString() : "";
                String avatar = meta.get("avatarUrl") != null ? meta.get("avatarUrl").toString() : "";

                entries.add(LeaderboardEntryDTO.builder()
                        .rank(currentRank++)
                        .studentId(studentId)
                        .name(name)
                        .leetcodeUsername(lc)
                        .codeforcesHandle(cf)
                        .avatarUrl(avatar)
                        .score(score != null ? score : 0.0)
                        .metric(cleanMetric)
                        .build());
            }

            return entries;
        } catch (Exception ex) {
            log.warn("Failed retrieving Redis leaderboard for key [{}]: {}", zsetKey, ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Gets a student's current 1-based rank in a specific classroom or global leaderboard.
     */
    public Optional<Long> getStudentRank(String classroomId, String metric, String studentId) {
        if (studentId == null || studentId.isBlank()) {
            return Optional.empty();
        }

        String cleanMetric = normalizeMetric(metric);
        String zsetKey = (classroomId != null && !classroomId.isBlank())
                ? CLASSROOM_KEY_PREFIX + classroomId + ":" + cleanMetric
                : GLOBAL_KEY_PREFIX + cleanMetric;

        try {
            Long rawRank = stringRedisTemplate.opsForZSet().reverseRank(zsetKey, studentId);
            return rawRank != null ? Optional.of(rawRank + 1) : Optional.empty();
        } catch (Exception ex) {
            log.warn("Failed retrieving student rank for [{}]: {}", studentId, ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Removes a student from a classroom's leaderboards (e.g. when un-enrolled).
     */
    public void removeStudentFromClassroom(String classroomId, String studentId) {
        if (classroomId == null || studentId == null) return;
        try {
            stringRedisTemplate.opsForZSet().remove(CLASSROOM_KEY_PREFIX + classroomId + ":" + METRIC_SOLVED, studentId);
            stringRedisTemplate.opsForZSet().remove(CLASSROOM_KEY_PREFIX + classroomId + ":" + METRIC_RATING, studentId);
            stringRedisTemplate.opsForZSet().remove(CLASSROOM_KEY_PREFIX + classroomId + ":" + METRIC_STREAK, studentId);
        } catch (Exception ex) {
            log.warn("Failed to remove student from classroom leaderboards: {}", ex.getMessage());
        }
    }

    /**
     * Clears all leaderboard data for a deleted classroom.
     */
    public void deleteClassroomLeaderboards(String classroomId) {
        if (classroomId == null) return;
        try {
            stringRedisTemplate.delete(List.of(
                    CLASSROOM_KEY_PREFIX + classroomId + ":" + METRIC_SOLVED,
                    CLASSROOM_KEY_PREFIX + classroomId + ":" + METRIC_RATING,
                    CLASSROOM_KEY_PREFIX + classroomId + ":" + METRIC_STREAK
            ));
        } catch (Exception ex) {
            log.warn("Failed to delete classroom leaderboards: {}", ex.getMessage());
        }
    }

    private String normalizeMetric(String metric) {
        if (metric == null || metric.isBlank()) return METRIC_SOLVED;
        return switch (metric.toLowerCase().trim()) {
            case "rating", "contest" -> METRIC_RATING;
            case "streak", "consistency" -> METRIC_STREAK;
            default -> METRIC_SOLVED;
        };
    }
}
