package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.DuplicateStudentException;
import com.tracker.leetcode.tracker.Exception.StudentNotFoundException;
import com.tracker.leetcode.tracker.Models.*;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.tracker.leetcode.tracker.Mapper.StudentMapper;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final ClassroomRepository classroomRepository;
    private final LeetCodeApiClient leetCodeApiClient;
    private final CodeforcesApiClient codeforcesApiClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisDistributedLockService lockService;
    private final RedisLeaderboardService leaderboardService;
    private final CacheManager cacheManager;
    private final StudentMapper studentMapper;
    private final RedisWebSocketBridge webSocketBridge;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.beans.factory.annotation.Qualifier("virtualThreadExecutor")
    private java.util.concurrent.Executor virtualThreadExecutor;

    // Helper method to keep code DRY - supports ID, email, LeetCode username, or Codeforces handle
    public Student getStudentOrThrow(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new StudentNotFoundException("Student identifier cannot be blank.");
        }
        String trimmed = identifier.trim();
        String lcHandle = ClassroomService.isLeetCodeUrl(trimmed) ? ClassroomService.extractLeetcodeUsername(trimmed) : "";
        String cfHandle = ClassroomService.isCodeforcesUrl(trimmed) ? ClassroomService.extractCodeforcesHandle(trimmed) : "";
        final String lookup = trimmed.startsWith("@") ? trimmed.substring(1).trim() : trimmed;

        return studentRepository.findById(lookup)
                .or(() -> studentRepository.findByEmail(lookup))
                .or(() -> studentRepository.findByLeetcodeUsername(lookup))
                .or(() -> studentRepository.findByCodeforcesHandle(lookup))
                .or(() -> !lcHandle.isBlank() ? studentRepository.findByLeetcodeUsername(lcHandle) : Optional.empty())
                .or(() -> !cfHandle.isBlank() ? studentRepository.findByCodeforcesHandle(cfHandle) : Optional.empty())
                .orElseThrow(() -> new StudentNotFoundException("Student '" + trimmed + "' not found in database. Please add them first!"));
    }

    /**
     * Fetches and updates student progress (calendar heatmap)
     * Results are cached for 30 minutes
     */
    @Cacheable(value = "student-progress", key = "#identifier")
    public Student fetchAndUpdateStudentProgress(String identifier) {
        log.info("Updating calendar heatmap for user: {}", identifier);
        Student student = getStudentOrThrow(identifier);
        if (student.getLeetcodeUsername() != null && !student.getLeetcodeUsername().isBlank()) {
            student.setProgressHistory(leetCodeApiClient.fetchCalendarData(student.getLeetcodeUsername()));
        }
        syncCodeforcesData(student);
        return studentRepository.save(student);
    }

    /**
     * Fetches and updates problem statistics
     * Results are cached for 30 minutes
     */
    @Cacheable(value = "student-stats", key = "#identifier")
    public Student fetchAndUpdateProblemStats(String identifier) {
        log.info("Updating problem stats for user: {}", identifier);
        Student student = getStudentOrThrow(identifier);
        if (student.getLeetcodeUsername() != null && !student.getLeetcodeUsername().isBlank()) {
            student.setProblemStats(leetCodeApiClient.fetchProblemStats(student.getLeetcodeUsername()));
        }
        return studentRepository.save(student);
    }

    /**
     * Fetches and updates recent submissions
     * Results are cached for 30 minutes
     */
    @Cacheable(value = "student-recent", key = "#identifier")
    public Student fetchAndUpdateRecentSubmissions(String identifier) {
        log.info("Updating recent submissions for user: {}", identifier);
        Student student = getStudentOrThrow(identifier);
        if (student.getLeetcodeUsername() != null && !student.getLeetcodeUsername().isBlank()) {
            student.setRecentSubmissions(leetCodeApiClient.fetchRecentSubmissions(student.getLeetcodeUsername(), 5));
        }
        syncCodeforcesData(student);
        return studentRepository.save(student);
    }

    /**
     * Fetches and updates extended profile (socials, contests, badges)
     * Results are cached for 1 hour
     */
    @Cacheable(value = "student-profile", key = "#identifier")
    public Student fetchAndUpdateExtendedProfile(String identifier) {
        log.info("Updating extended profile for user: {}", identifier);
        Student student = getStudentOrThrow(identifier);

        if (student.getLeetcodeUsername() != null && !student.getLeetcodeUsername().isBlank()) {
            try {
                Student extendedData = leetCodeApiClient.fetchExtendedProfileDetails(student.getLeetcodeUsername());
                student.setAbout(extendedData.getAbout());
                student.setRank(extendedData.getRank());
                student.setCurrentContestRating(extendedData.getCurrentContestRating());
                student.setSocialMedia(extendedData.getSocialMedia());
                student.setBadges(extendedData.getBadges());
                student.setContestHistory(extendedData.getContestHistory());
                if (extendedData.getAvatarUrl() != null && !extendedData.getAvatarUrl().isBlank()) {
                    student.setAvatarUrl(extendedData.getAvatarUrl());
                }
                student.setSkills(leetCodeApiClient.fetchSkillStats(student.getLeetcodeUsername()));
            } catch (Exception e) {
                log.warn("Failed fetching LeetCode extended data for {}: {}", student.getLeetcodeUsername(), e.getMessage());
            }
        }

        // If student has Codeforces handle, sync CF details as well
        syncCodeforcesData(student);

        return studentRepository.save(student);
    }

    /**
     * Syncs all profile data from LeetCode AND/OR Codeforces, merges metrics, and auto-validates assignments.
     * Uses Redis Distributed Lock to prevent duplicate concurrent syncs.
     */
    public Student syncAllProfileData(Student student) {
        String studentId = student.getId();
        String lockIdentifier = studentId != null ? studentId : student.getLeetcodeUsername();
        String lockKey = "sync:student:" + lockIdentifier;

        // Skip redundant sync if already synced in the last 10 seconds
        if (student.getLastSyncedAt() != null &&
                Duration.between(student.getLastSyncedAt(), Instant.now()).toSeconds() < 10) {
            log.info("Student [{}] was already synced {} seconds ago, skipping redundant sync",
                    lockIdentifier, Duration.between(student.getLastSyncedAt(), Instant.now()).toSeconds());
            return student;
        }

        return lockService.executeWithLock(lockKey, Duration.ofSeconds(6), Duration.ofSeconds(45), () -> {
            Student target = student;
            if (studentId != null) {
                target = studentRepository.findById(studentId).orElse(student);
                if (target.getLastSyncedAt() != null &&
                        Duration.between(target.getLastSyncedAt(), Instant.now()).toSeconds() < 10) {
                    log.info("Student [{}] was synced while waiting for lock, returning fresh entity", lockIdentifier);
                    return target;
                }
            }
            return doSyncAllProfileData(target);
        }).orElseGet(() -> {
            log.info("Concurrent sync timed out for student [{}] - reloading persisted profile", lockIdentifier);
            if (studentId != null) {
                return studentRepository.findById(studentId).orElse(student);
            }
            return student;
        });
    }

    private record CfSyncPayload(Student cfUser, List<CodeforcesContestHistory> cfContests, CodeforcesApiClient.CodeforcesSubmissionData cfData) {}

    private Student doSyncAllProfileData(Student student) {
        log.info("Performing FULL multi-platform profile sync for student ID: {}", student.getId());

        String lcUsername = student.getLeetcodeUsername();
        String cfHandle = student.getCodeforcesHandle();

        boolean hasLc = lcUsername != null && !lcUsername.isBlank();
        boolean hasCf = cfHandle != null && !cfHandle.isBlank();

        java.util.concurrent.Executor executor = virtualThreadExecutor != null
                ? virtualThreadExecutor
                : java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor();

        // 1. Fetch LeetCode Data (concurrently on Virtual Thread if present)
        CompletableFuture<Void> lcFuture = CompletableFuture.runAsync(() -> {
            if (hasLc) {
                log.info("Fetching LeetCode data concurrently for user [{}]", lcUsername);
                try {
                    student.setProgressHistory(leetCodeApiClient.fetchCalendarData(lcUsername));
                } catch (Exception e) {
                    log.warn("Failed fetching LeetCode calendar data for {}: {}", lcUsername, e.getMessage());
                }

                try {
                    student.setProblemStats(leetCodeApiClient.fetchProblemStats(lcUsername));
                } catch (Exception e) {
                    log.warn("Failed fetching LeetCode problem stats for {}: {}", lcUsername, e.getMessage());
                }

                try {
                    student.setRecentSubmissions(leetCodeApiClient.fetchRecentSubmissions(lcUsername, 20));
                } catch (Exception e) {
                    log.warn("Failed fetching LeetCode recent submissions for {}: {}", lcUsername, e.getMessage());
                }

                try {
                    student.setSkills(leetCodeApiClient.fetchSkillStats(lcUsername));
                } catch (Exception e) {
                    log.warn("Failed fetching LeetCode skills for {}: {}", lcUsername, e.getMessage());
                }

                try {
                    Student extendedData = leetCodeApiClient.fetchExtendedProfileDetails(lcUsername);
                    if (extendedData != null) {
                        student.setAbout(extendedData.getAbout());
                        student.setRank(extendedData.getRank());
                        student.setCurrentContestRating(extendedData.getCurrentContestRating());
                        student.setSocialMedia(extendedData.getSocialMedia());
                        student.setBadges(extendedData.getBadges());
                        student.setContestHistory(extendedData.getContestHistory());
                        if (extendedData.getAvatarUrl() != null && !extendedData.getAvatarUrl().isBlank()) {
                            student.setAvatarUrl(extendedData.getAvatarUrl());
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed fetching LeetCode extended data for {}: {}", lcUsername, e.getMessage());
                }
            }
        }, executor);

        // 2. Fetch Codeforces Data (concurrently on Virtual Thread if present)
        CompletableFuture<CfSyncPayload> cfFuture = CompletableFuture.supplyAsync(() -> {
            if (hasCf) {
                log.info("Fetching Codeforces data concurrently for handle [{}]", cfHandle);
                Student cfUser = null;
                List<CodeforcesContestHistory> cfContests = null;
                CodeforcesApiClient.CodeforcesSubmissionData cfData = null;

                try {
                    cfUser = codeforcesApiClient.fetchUserInfo(cfHandle);
                } catch (Exception e) {
                    log.warn("Failed fetching Codeforces user info for handle [{}]: {}", cfHandle, e.getMessage());
                }

                try {
                    cfContests = codeforcesApiClient.fetchContestHistory(cfHandle);
                } catch (Exception e) {
                    log.warn("Failed fetching Codeforces contest history for handle [{}]: {}", cfHandle, e.getMessage());
                }

                try {
                    cfData = codeforcesApiClient.fetchSubmissions(cfHandle);
                } catch (Exception e) {
                    log.warn("Failed fetching Codeforces submissions for handle [{}]: {}", cfHandle, e.getMessage());
                }

                return new CfSyncPayload(cfUser, cfContests, cfData);
            }
            return null;
        }, executor);

        // Wait for both concurrent platform fetches to complete
        CompletableFuture.allOf(lcFuture, cfFuture).join();

        // 3. Apply Codeforces Data & Merge metrics safely
        CfSyncPayload cfResult = cfFuture.join();
        if (cfResult != null) {
            if (cfResult.cfUser != null) {
                student.setCodeforcesRating(cfResult.cfUser.getCodeforcesRating());
                student.setCodeforcesMaxRating(cfResult.cfUser.getCodeforcesMaxRating());
                student.setCodeforcesRank(cfResult.cfUser.getCodeforcesRank());
                student.setCodeforcesMaxRank(cfResult.cfUser.getCodeforcesMaxRank());
                student.setCodeforcesAvatarUrl(cfResult.cfUser.getCodeforcesAvatarUrl());
                if (student.getAvatarUrl() == null || student.getAvatarUrl().isBlank()) {
                    student.setAvatarUrl(cfResult.cfUser.getCodeforcesAvatarUrl());
                }
            }
            if (cfResult.cfContests != null) {
                student.setCodeforcesContestHistory(cfResult.cfContests);
            }
            if (cfResult.cfData != null) {
                student.setCodeforcesSolvedCount(cfResult.cfData.solvedCount());

                // Merge recent submissions (LeetCode + Codeforces, sorted by timestamp descending, keep top 30)
                List<RecentSubmission> combinedSubmissions = new ArrayList<>();
                if (student.getRecentSubmissions() != null) {
                    combinedSubmissions.addAll(student.getRecentSubmissions());
                }
                if (cfResult.cfData.recentSubmissions() != null) {
                    combinedSubmissions.addAll(cfResult.cfData.recentSubmissions());
                }
                combinedSubmissions.sort((a, b) -> Long.compare(b.getTimestamp(), a.getTimestamp()));
                if (combinedSubmissions.size() > 30) {
                    combinedSubmissions = new ArrayList<>(combinedSubmissions.subList(0, 30));
                }
                student.setRecentSubmissions(combinedSubmissions);

                // Merge daily activity into progressHistory for combined heatmap
                student.setProgressHistory(mergeDailyProgress(student.getProgressHistory(), cfResult.cfData.dailyActivity()));

                // Merge skills
                student.setSkills(mergeSkills(student.getSkills(), cfResult.cfData.skills()));

                log.info("Successfully merged Codeforces data for handle [{}]. Solved: {}, Rating: {}",
                        cfHandle, cfResult.cfData.solvedCount(), cfResult.cfUser != null ? cfResult.cfUser.getCodeforcesRating() : 0);
            }
        }

        // 4. Auto-validate any pending assignments
        autoValidateAssignmentsForStudent(student);

        student.setLastSyncedAt(Instant.now());

        Student saved = studentRepository.save(student);

        // 5. Invalidate all student caches and dependent classroom dashboards
        evictStudentCaches(saved);

        // 6. Update real-time Redis leaderboards
        updateRedisLeaderboards(saved);

        return saved;
    }

    @CacheEvict(value = {"student-progress", "student-stats", "student-recent", "student-profile"},
                key = "#identifier")
    public Student syncAllProfileData(String identifier) {
        Student student = getStudentOrThrow(identifier);
        return syncAllProfileData(student);
    }

    /**
     * Invalidate caches across all known student identifiers (id, LC, CF, email) and classroom dashboards.
     */
    public void evictStudentCaches(Student student) {
        if (student == null || cacheManager == null) return;
        Set<String> keys = new HashSet<>();
        if (student.getId() != null) keys.add(student.getId());
        if (student.getLeetcodeUsername() != null) keys.add(student.getLeetcodeUsername());
        if (student.getCodeforcesHandle() != null) keys.add(student.getCodeforcesHandle());
        if (student.getEmail() != null) keys.add(student.getEmail());

        List<String> cacheNames = List.of("student-progress", "student-stats", "student-recent", "student-profile");
        for (String cName : cacheNames) {
            Cache cache = cacheManager.getCache(cName);
            if (cache != null) {
                for (String k : keys) {
                    cache.evict(k);
                }
            }
        }

        // Evict classroom dashboard cache so mentors immediately see refreshed student stats
        Cache dashCache = cacheManager.getCache("classroom-dashboard");
        if (dashCache != null) {
            dashCache.clear();
        }
    }

    /**
     * Updates student metrics in Redis real-time leaderboards.
     */
    public void updateRedisLeaderboards(Student student) {
        if (student == null || student.getId() == null) return;
        try {
            List<Classroom> classrooms = classroomRepository.findByStudentIdsContaining(student.getId());
            List<String> classroomIds = classrooms != null
                    ? classrooms.stream().map(Classroom::getId).toList()
                    : Collections.emptyList();

            int lcSolved = student.getProblemStats() != null ? studentMapper.calculateLeetcodeSolved(student.getProblemStats()) : 0;
            int cfSolved = student.getCodeforcesSolvedCount() != null ? student.getCodeforcesSolvedCount() : 0;
            int totalSolved = lcSolved + cfSolved;
            double rating = Math.max(
                    student.getCurrentContestRating(),
                    student.getCodeforcesRating() != null ? student.getCodeforcesRating() : 0.0
            );
            int streak = studentMapper.calculateStreak(student.getProgressHistory());

            leaderboardService.updateStudentMetrics(
                    student.getId(),
                    student.getName(),
                    student.getLeetcodeUsername(),
                    student.getCodeforcesHandle(),
                    student.getAvatarUrl(),
                    totalSolved,
                    rating,
                    streak,
                    classroomIds
            );
        } catch (Exception ex) {
            log.warn("Failed updating student metrics in Redis leaderboards: {}", ex.getMessage());
        }
    }

    /**
     * Synchronizes and aggregates Codeforces data
     */
    private void syncCodeforcesData(Student student) {
        String cfHandle = student.getCodeforcesHandle();
        if (cfHandle == null || cfHandle.isBlank()) {
            return;
        }

        try {
            log.info("Syncing Codeforces data for handle [{}]", cfHandle);

            // 1. User Info (Rating, Rank, Avatar)
            Student cfUser = codeforcesApiClient.fetchUserInfo(cfHandle);
            student.setCodeforcesRating(cfUser.getCodeforcesRating());
            student.setCodeforcesMaxRating(cfUser.getCodeforcesMaxRating());
            student.setCodeforcesRank(cfUser.getCodeforcesRank());
            student.setCodeforcesMaxRank(cfUser.getCodeforcesMaxRank());
            student.setCodeforcesAvatarUrl(cfUser.getCodeforcesAvatarUrl());
            if (student.getAvatarUrl() == null || student.getAvatarUrl().isBlank()) {
                student.setAvatarUrl(cfUser.getCodeforcesAvatarUrl());
            }

            // 2. Contest History
            List<CodeforcesContestHistory> cfContests = codeforcesApiClient.fetchContestHistory(cfHandle);
            student.setCodeforcesContestHistory(cfContests);

            // 3. Submissions (Solved count, Recent list, Daily activity heatmap, Skills)
            CodeforcesApiClient.CodeforcesSubmissionData cfData = codeforcesApiClient.fetchSubmissions(cfHandle);
            student.setCodeforcesSolvedCount(cfData.solvedCount());

            // Merge recent submissions (LeetCode + Codeforces, sorted by timestamp descending, keep top 30)
            List<RecentSubmission> combinedSubmissions = new ArrayList<>();
            if (student.getRecentSubmissions() != null) {
                combinedSubmissions.addAll(student.getRecentSubmissions());
            }
            if (cfData.recentSubmissions() != null) {
                combinedSubmissions.addAll(cfData.recentSubmissions());
            }
            combinedSubmissions.sort((a, b) -> Long.compare(b.getTimestamp(), a.getTimestamp()));
            if (combinedSubmissions.size() > 30) {
                combinedSubmissions = new ArrayList<>(combinedSubmissions.subList(0, 30));
            }
            student.setRecentSubmissions(combinedSubmissions);

            // Merge daily activity into progressHistory for combined heatmap
            student.setProgressHistory(mergeDailyProgress(student.getProgressHistory(), cfData.dailyActivity()));

            // Merge skills
            student.setSkills(mergeSkills(student.getSkills(), cfData.skills()));

            log.info("Successfully merged Codeforces data for handle [{}]. Solved: {}, Rating: {}",
                    cfHandle, cfData.solvedCount(), cfUser.getCodeforcesRating());
        } catch (Exception e) {
            log.warn("Failed syncing Codeforces data for handle [{}]: {}", cfHandle, e.getMessage());
        }
    }

    private List<DailyProgress> mergeDailyProgress(List<DailyProgress> existing, Map<LocalDate, Integer> cfActivity) {
        Map<LocalDate, Integer> merged = new HashMap<>();
        if (existing != null) {
            for (DailyProgress dp : existing) {
                if (dp.getDate() != null) {
                    merged.put(dp.getDate(), dp.getQuestionSolved());
                }
            }
        }
        if (cfActivity != null) {
            for (Map.Entry<LocalDate, Integer> entry : cfActivity.entrySet()) {
                merged.merge(entry.getKey(), entry.getValue(), Integer::sum);
            }
        }
        return merged.entrySet().stream()
                .map(e -> new DailyProgress(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(DailyProgress::getDate))
                .collect(Collectors.toList());
    }

    private List<SkillStat> mergeSkills(List<SkillStat> existing, List<SkillStat> cfSkills) {
        Map<String, Integer> skillMap = new LinkedHashMap<>();
        if (existing != null) {
            for (SkillStat s : existing) {
                skillMap.put(s.getTagName(), s.getProblemsSolved());
            }
        }
        if (cfSkills != null) {
            for (SkillStat s : cfSkills) {
                skillMap.merge(s.getTagName(), s.getProblemsSolved(), Integer::sum);
            }
        }
        return skillMap.entrySet().stream()
                .map(e -> new SkillStat(e.getKey(), e.getValue()))
                .sorted((a, b) -> Integer.compare(b.getProblemsSolved(), a.getProblemsSolved()))
                .collect(Collectors.toList());
    }

    private void autoValidateAssignmentsForStudent(Student student) {
        try {
            List<Classroom> classrooms = classroomRepository.findByStudentIdsContaining(student.getId());
            if (classrooms == null || classrooms.isEmpty() || student.getRecentSubmissions() == null) {
                return;
            }

            if (student.getManuallyCompletedAssignments() == null) {
                student.setManuallyCompletedAssignments(new ArrayList<>());
            }

            boolean updated = false;
            for (Classroom classroom : classrooms) {
                if (classroom.getAssignments() == null) continue;
                for (Assignment assignment : classroom.getAssignments()) {
                    if (student.getManuallyCompletedAssignments().contains(assignment.getId())) {
                        continue;
                    }

                    boolean matched = student.getRecentSubmissions().stream().anyMatch(sub -> {
                        boolean platformMatch = assignment.getPlatform() == null || sub.getPlatform() == assignment.getPlatform();
                        boolean slugMatch = isProblemSlugMatch(sub.getTitleSlug(), assignment.getTitleSlug());
                        return platformMatch && slugMatch;
                    });

                    if (matched) {
                        student.getManuallyCompletedAssignments().add(assignment.getId());
                        updated = true;
                        log.info("Auto-validated assignment [{}] for student [{}]", assignment.getId(), student.getName());
                    }
                }
            }
            if (updated) {
                for (Classroom classroom : classrooms) {
                    webSocketBridge.broadcastClassroomUpdate(classroom.getId(), "UPDATE", "Assignment auto-validated!");
                }
            }
        } catch (Exception e) {
            log.warn("Failed during auto-validation of assignments for student {}: {}", student.getLeetcodeUsername(), e.getMessage());
        }
    }

    public static boolean isProblemSlugMatch(String subSlug, String assignSlug) {
        if (subSlug == null || assignSlug == null) return false;
        String cleanSub = subSlug.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        String cleanAssign = assignSlug.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        return cleanSub.equalsIgnoreCase(cleanAssign);
    }

    /**
     * Updates student's LeetCode and Codeforces handles and triggers a fresh sync
     */
    @CacheEvict(value = {"student-progress", "student-stats", "student-recent", "student-profile"},
                allEntries = true)
    public Student updateStudentHandles(String studentId, String leetcodeUsername, String codeforcesHandle) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found with ID: " + studentId));

        String rawLc = (leetcodeUsername != null && !leetcodeUsername.trim().isEmpty()) ? leetcodeUsername.trim() : null;
        String rawCf = (codeforcesHandle != null && !codeforcesHandle.trim().isEmpty()) ? codeforcesHandle.trim() : null;

        String newLc = rawLc != null ? ClassroomService.extractLeetcodeUsername(rawLc) : null;
        if (newLc != null && newLc.isBlank()) newLc = null;

        String newCf = rawCf != null ? ClassroomService.extractCodeforcesHandle(rawCf) : null;
        if (newCf != null && newCf.isBlank()) newCf = null;

        if (newLc == null && newCf == null) {
            throw new IllegalArgumentException("At least one platform username (LeetCode or Codeforces) must remain linked.");
        }

        if (newLc != null && !newLc.equalsIgnoreCase(student.getLeetcodeUsername())) {
            Optional<Student> existing = studentRepository.findByLeetcodeUsername(newLc);
            if (existing.isPresent() && !existing.get().getId().equals(student.getId())) {
                throw new DuplicateStudentException("LeetCode username '" + newLc + "' is already in use.");
            }
        }

        if (newCf != null && !newCf.equalsIgnoreCase(student.getCodeforcesHandle())) {
            Optional<Student> existing = studentRepository.findByCodeforcesHandle(newCf);
            if (existing.isPresent() && !existing.get().getId().equals(student.getId())) {
                throw new DuplicateStudentException("Codeforces handle '" + newCf + "' is already in use.");
            }
        }

        student.setLeetcodeUsername(newLc);
        student.setCodeforcesHandle(newCf);

        Student saved = studentRepository.save(student);
        return syncAllProfileData(saved);
    }

    /**
     * Async profile synchronization with cache invalidation
     */
    @Async("taskExecutor")
    public CompletableFuture<Void> syncProfileAsync(String username) {
        try {
            syncAllProfileData(username);
            log.info("Async sync completed successfully for student [{}]", username);
        } catch (Exception e) {
            log.error("Async sync failed for student [{}]: {}", username, e.getMessage(), e);
        }
        return CompletableFuture.completedFuture(null);
    }

    /**
     * Generates a comprehensive CSV report of a student's profile, difficulty breakdown,
     * topic mastery, assignments, submissions, and contest history.
     */
    public String generateStudentReportCsv(String identifier) {
        Student student = getStudentOrThrow(identifier);

        StringBuilder csv = new StringBuilder();
        csv.append("================================================================================\n");
        csv.append("MENTORSYNC - STUDENT PERFORMANCE REPORT\n");
        csv.append("================================================================================\n");
        csv.append("Student Name,").append(escapeCsv(student.getName())).append("\n");
        csv.append("Email,").append(escapeCsv(student.getEmail())).append("\n");
        csv.append("LeetCode Username,").append(escapeCsv(student.getLeetcodeUsername())).append("\n");
        csv.append("Codeforces Handle,").append(escapeCsv(student.getCodeforcesHandle())).append("\n");
        csv.append("Report Generated At,").append(java.time.LocalDateTime.now()).append("\n");

        List<Classroom> classrooms = classroomRepository.findByStudentIdsContaining(student.getId());
        String classroomNames = classrooms != null ? classrooms.stream().map(Classroom::getClassName).collect(Collectors.joining("; ")) : "";
        csv.append("Enrolled Classrooms,").append(escapeCsv(classroomNames)).append("\n\n");

        // Section 1: Summary Statistics
        csv.append("--- SUMMARY STATISTICS ---\n");
        int easyCount = 0, medCount = 0, hardCount = 0;
        if (student.getProblemStats() != null) {
            for (var stat : student.getProblemStats()) {
                if ("Easy".equalsIgnoreCase(stat.getDifficulty())) easyCount = stat.getCount();
                else if ("Medium".equalsIgnoreCase(stat.getDifficulty())) medCount = stat.getCount();
                else if ("Hard".equalsIgnoreCase(stat.getDifficulty())) hardCount = stat.getCount();
            }
        }
        int lcSolved = easyCount + medCount + hardCount;
        int cfSolved = student.getCodeforcesSolvedCount() != null ? student.getCodeforcesSolvedCount() : 0;
        int totalSolved = lcSolved + cfSolved;

        csv.append("Metric,Value\n");
        csv.append("Total Problems Solved,").append(totalSolved).append("\n");
        csv.append("LeetCode Problems Solved,").append(lcSolved).append("\n");
        csv.append("  - LeetCode Easy,").append(easyCount).append("\n");
        csv.append("  - LeetCode Medium,").append(medCount).append("\n");
        csv.append("  - LeetCode Hard,").append(hardCount).append("\n");
        csv.append("Codeforces Problems Solved,").append(cfSolved).append("\n");
        csv.append("LeetCode Contest Rating,").append(Math.round(student.getCurrentContestRating())).append("\n");
        csv.append("LeetCode Global Rank,").append(escapeCsv(student.getRank())).append("\n");
        csv.append("Codeforces Rating,").append(student.getCodeforcesRating() != null ? student.getCodeforcesRating() : 0).append("\n");
        csv.append("Codeforces Max Rating,").append(student.getCodeforcesMaxRating() != null ? student.getCodeforcesMaxRating() : 0).append("\n");
        csv.append("Codeforces Rank,").append(escapeCsv(student.getCodeforcesRank())).append("\n");
        int streak = student.getProgressHistory() != null ? studentMapper.calculateStreak(student.getProgressHistory()) : 0;
        csv.append("Daily Streak,").append(streak).append("\n\n");

        // Section 2: Topic & Skill Mastery
        csv.append("--- TOPIC & SKILL PROFICIENCY ---\n");
        csv.append("Topic Name,Problems Solved\n");
        if (student.getSkills() != null && !student.getSkills().isEmpty()) {
            for (var skill : student.getSkills()) {
                csv.append(escapeCsv(skill.getTagName())).append(",")
                        .append(skill.getProblemsSolved()).append("\n");
            }
        } else {
            csv.append("No topic data recorded,0\n");
        }
        csv.append("\n");

        // Section 3: Classroom Assignments
        csv.append("--- CLASSROOM ASSIGNMENTS ---\n");
        csv.append("Classroom,Assignment Title,Platform,Problem Slug,Deadline,Status\n");
        boolean hasAssignments = false;
        if (classrooms != null && !classrooms.isEmpty()) {
            for (Classroom c : classrooms) {
                if (c.getAssignments() != null) {
                    for (Assignment a : c.getAssignments()) {
                        hasAssignments = true;
                        boolean isDone = student.getManuallyCompletedAssignments() != null
                                && student.getManuallyCompletedAssignments().contains(a.getId());
                        if (!isDone && student.getRecentSubmissions() != null) {
                            String normTarget = a.getTitleSlug() != null ? a.getTitleSlug().replace("-", "").toLowerCase() : "";
                            isDone = student.getRecentSubmissions().stream().anyMatch(sub -> {
                                String normSub = sub.getTitleSlug() != null ? sub.getTitleSlug().replace("-", "").toLowerCase() : "";
                                return normSub.equals(normTarget);
                            });
                        }
                        String deadlineStr = a.getEndTimestamp() > 0 ? java.time.Instant.ofEpochSecond(a.getEndTimestamp()).toString() : "No deadline";
                        csv.append(escapeCsv(c.getClassName())).append(",")
                                .append(escapeCsv(a.getTitle() != null ? a.getTitle() : a.getTitleSlug())).append(",")
                                .append(a.getPlatform() != null ? a.getPlatform().name() : "LEETCODE").append(",")
                                .append(escapeCsv(a.getTitleSlug())).append(",")
                                .append(deadlineStr).append(",")
                                .append(isDone ? "COMPLETED" : "PENDING").append("\n");
                    }
                }
            }
        }
        if (!hasAssignments) {
            csv.append("None,N/A,N/A,N/A,N/A,N/A\n");
        }
        csv.append("\n");

        // Section 4: Recent Submissions
        csv.append("--- RECENT SUBMISSIONS ---\n");
        csv.append("Platform,Problem Title,Problem Slug,Submission Timestamp\n");
        if (student.getRecentSubmissions() != null && !student.getRecentSubmissions().isEmpty()) {
            for (var sub : student.getRecentSubmissions()) {
                String timeStr = sub.getTimestamp() > 0 ? java.time.Instant.ofEpochSecond(sub.getTimestamp()).toString() : "N/A";
                csv.append(sub.getPlatform() != null ? sub.getPlatform().name() : "LEETCODE").append(",")
                        .append(escapeCsv(sub.getTitle())).append(",")
                        .append(escapeCsv(sub.getTitleSlug())).append(",")
                        .append(timeStr).append("\n");
            }
        } else {
            csv.append("No recent submissions recorded,,,N/A\n");
        }
        csv.append("\n");

        // Section 5: Contest Rating Progression
        csv.append("--- CONTEST HISTORY ---\n");
        csv.append("Platform,Contest Name,Rating,Global Rank,Date\n");
        boolean hasContests = false;
        if (student.getContestHistory() != null && !student.getContestHistory().isEmpty()) {
            hasContests = true;
            for (var ch : student.getContestHistory()) {
                csv.append("LEETCODE,")
                        .append(escapeCsv(ch.getTitle())).append(",")
                        .append(Math.round(ch.getRating())).append(",")
                        .append(ch.getRanking()).append(",")
                        .append(ch.getTimestamp() > 0 ? java.time.Instant.ofEpochSecond(ch.getTimestamp()).toString() : "N/A")
                        .append("\n");
            }
        }
        if (student.getCodeforcesContestHistory() != null && !student.getCodeforcesContestHistory().isEmpty()) {
            hasContests = true;
            for (var cfh : student.getCodeforcesContestHistory()) {
                csv.append("CODEFORCES,")
                        .append(escapeCsv(cfh.getContestName())).append(",")
                        .append(cfh.getNewRating()).append(",")
                        .append(cfh.getRank()).append(",")
                        .append(cfh.getRatingUpdateTimeSeconds() > 0 ? java.time.Instant.ofEpochSecond(cfh.getRatingUpdateTimeSeconds()).toString() : "N/A")
                        .append("\n");
            }
        }
        if (!hasContests) {
            csv.append("No contest history recorded,,,,N/A\n");
        }

        return csv.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}