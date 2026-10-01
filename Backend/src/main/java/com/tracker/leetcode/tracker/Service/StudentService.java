package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.DuplicateStudentException;
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

    // Helper method to keep code DRY - supports LeetCode username, Codeforces handle, or ID
    public Student getStudentOrThrow(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new StudentNotFoundException("Student identifier cannot be blank.");
        }
        return studentRepository.findByLeetcodeUsername(identifier)
                .or(() -> studentRepository.findByCodeforcesHandle(identifier))
                .or(() -> studentRepository.findById(identifier))
                .orElseThrow(() -> new StudentNotFoundException("Student '" + identifier + "' not found in database. Please add them first!"));
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
     * Syncs all profile data from LeetCode AND/OR Codeforces, merges metrics, and auto-validates assignments
     */
    public Student syncAllProfileData(Student student) {
        log.info("Performing FULL multi-platform profile sync for student ID: {}", student.getId());

        // 1. Sync LeetCode Data (if present)
        String lcUsername = student.getLeetcodeUsername();
        if (lcUsername != null && !lcUsername.isBlank()) {
            try {
                student.setProgressHistory(leetCodeApiClient.fetchCalendarData(lcUsername));
                student.setProblemStats(leetCodeApiClient.fetchProblemStats(lcUsername));
                student.setRecentSubmissions(leetCodeApiClient.fetchRecentSubmissions(lcUsername, 20));
                student.setSkills(leetCodeApiClient.fetchSkillStats(lcUsername));

                Student extendedData = leetCodeApiClient.fetchExtendedProfileDetails(lcUsername);
                student.setAbout(extendedData.getAbout());
                student.setRank(extendedData.getRank());
                student.setCurrentContestRating(extendedData.getCurrentContestRating());
                student.setSocialMedia(extendedData.getSocialMedia());
                student.setBadges(extendedData.getBadges());
                student.setContestHistory(extendedData.getContestHistory());
                if (extendedData.getAvatarUrl() != null && !extendedData.getAvatarUrl().isBlank()) {
                    student.setAvatarUrl(extendedData.getAvatarUrl());
                }
            } catch (Exception e) {
                log.warn("Failed fetching LeetCode data for {}: {}", lcUsername, e.getMessage());
            }
        }

        // 2. Sync Codeforces Data (if present)
        syncCodeforcesData(student);

        // 3. Auto-validate any pending assignments
        autoValidateAssignmentsForStudent(student);

        return studentRepository.save(student);
    }

    @CacheEvict(value = {"student-progress", "student-stats", "student-recent", "student-profile"},
                key = "#identifier")
    public Student syncAllProfileData(String identifier) {
        Student student = getStudentOrThrow(identifier);
        return syncAllProfileData(student);
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

        String newLc = (leetcodeUsername != null && !leetcodeUsername.trim().isEmpty()) ? leetcodeUsername.trim() : null;
        String newCf = (codeforcesHandle != null && !codeforcesHandle.trim().isEmpty()) ? codeforcesHandle.trim() : null;

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
}