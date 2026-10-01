package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.StudentNotFoundException;
import com.tracker.leetcode.tracker.Models.*;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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

    // Helper method to keep code DRY
    private Student getStudentOrThrow(String username) {
        return studentRepository.findByLeetcodeUsername(username)
                .orElseThrow(() -> new StudentNotFoundException("Student '" + username + "' not found in database. Please add them first!"));
    }

    /**
     * Fetches and updates student progress (calendar heatmap)
     * Results are cached for 30 minutes
     */
    @Cacheable(value = "student-progress", key = "#username")
    public Student fetchAndUpdateStudentProgress(String username) {
        log.info("Updating calendar heatmap for user: {}", username);
        Student student = getStudentOrThrow(username);
        student.setProgressHistory(leetCodeApiClient.fetchCalendarData(username));
        return studentRepository.save(student);
    }

    /**
     * Fetches and updates problem statistics
     * Results are cached for 30 minutes
     */
    @Cacheable(value = "student-stats", key = "#username")
    public Student fetchAndUpdateProblemStats(String username) {
        log.info("Updating problem stats for user: {}", username);
        Student student = getStudentOrThrow(username);
        student.setProblemStats(leetCodeApiClient.fetchProblemStats(username));
        return studentRepository.save(student);
    }

    /**
     * Fetches and updates recent submissions
     * Results are cached for 30 minutes
     */
    @Cacheable(value = "student-recent", key = "#username")
    public Student fetchAndUpdateRecentSubmissions(String username) {
        log.info("Updating recent submissions for user: {}", username);
        Student student = getStudentOrThrow(username);
        student.setRecentSubmissions(leetCodeApiClient.fetchRecentSubmissions(username, 5));
        return studentRepository.save(student);
    }

    /**
     * Fetches and updates extended profile (socials, contests, badges)
     * Results are cached for 1 hour
     */
    @Cacheable(value = "student-profile", key = "#username")
    public Student fetchAndUpdateExtendedProfile(String username) {
        log.info("Updating extended profile (Socials, Contests, Badges) for user: {}", username);
        Student student = getStudentOrThrow(username);

        Student extendedData = leetCodeApiClient.fetchExtendedProfileDetails(username);

        student.setAbout(extendedData.getAbout());
        student.setRank(extendedData.getRank());
        student.setCurrentContestRating(extendedData.getCurrentContestRating());
        student.setSocialMedia(extendedData.getSocialMedia());
        student.setBadges(extendedData.getBadges());
        student.setContestHistory(extendedData.getContestHistory());
        student.setAvatarUrl(extendedData.getAvatarUrl());
        student.setSkills(leetCodeApiClient.fetchSkillStats(username));

        // If student has Codeforces handle, sync CF details as well
        syncCodeforcesData(student);

        return studentRepository.save(student);
    }

    /**
     * Syncs all profile data from LeetCode AND Codeforces, merges metrics, and auto-validates assignments
     */
    @CacheEvict(value = {"student-progress", "student-stats", "student-recent", "student-profile"},
                key = "#username")
    public Student syncAllProfileData(String username) {
        log.info("Performing FULL multi-platform profile sync for user: {}", username);
        Student student = getStudentOrThrow(username);

        // 1. Sync LeetCode Data
        try {
            student.setProgressHistory(leetCodeApiClient.fetchCalendarData(username));
            student.setProblemStats(leetCodeApiClient.fetchProblemStats(username));
            student.setRecentSubmissions(leetCodeApiClient.fetchRecentSubmissions(username, 20));
            student.setSkills(leetCodeApiClient.fetchSkillStats(username));

            Student extendedData = leetCodeApiClient.fetchExtendedProfileDetails(username);
            student.setAbout(extendedData.getAbout());
            student.setRank(extendedData.getRank());
            student.setCurrentContestRating(extendedData.getCurrentContestRating());
            student.setSocialMedia(extendedData.getSocialMedia());
            student.setBadges(extendedData.getBadges());
            student.setContestHistory(extendedData.getContestHistory());
            student.setAvatarUrl(extendedData.getAvatarUrl());
        } catch (Exception e) {
            log.warn("Failed fetching LeetCode data for {}: {}", username, e.getMessage());
        }

        // 2. Sync Codeforces Data (if handle is present)
        syncCodeforcesData(student);

        // 3. Auto-validate any pending assignments
        autoValidateAssignmentsForStudent(student);

        return studentRepository.save(student);
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
            CodeforcesApiClient.CodeforcesSubmissionData cfData = codeforcesApiClient.fetchSubmissions(cfHandle, 500);
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
                        boolean timeMatch = (assignment.getStartTimestamp() == 0 || sub.getTimestamp() >= assignment.getStartTimestamp())
                                && (assignment.getEndTimestamp() == 0 || sub.getTimestamp() <= assignment.getEndTimestamp());
                        return platformMatch && slugMatch && timeMatch;
                    });

                    if (matched) {
                        student.getManuallyCompletedAssignments().add(assignment.getId());
                        updated = true;
                        log.info("Auto-validated assignment [{}] for student [{}]", assignment.getId(), student.getLeetcodeUsername());
                    }
                }
            }
            if (updated && messagingTemplate != null) {
                for (Classroom classroom : classrooms) {
                    messagingTemplate.convertAndSend("/topic/classrooms/" + classroom.getId(),
                            (Object) Map.of("action", "UPDATE", "message", "Assignment auto-validated!"));
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

        if (leetcodeUsername != null && !leetcodeUsername.isBlank()) {
            student.setLeetcodeUsername(leetcodeUsername.trim());
        }
        if (codeforcesHandle != null) {
            String trimmed = codeforcesHandle.trim();
            student.setCodeforcesHandle(trimmed.isEmpty() ? null : trimmed);
        }

        studentRepository.save(student);
        return syncAllProfileData(student.getLeetcodeUsername());
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
}