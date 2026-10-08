package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.AssignmentAnalyticsDTO;
import com.tracker.leetcode.tracker.DTO.AtRiskStudentDTO;
import com.tracker.leetcode.tracker.DTO.BulkImportResponseDTO;
import com.tracker.leetcode.tracker.DTO.ClassroomAnalyticsDTO;
import com.tracker.leetcode.tracker.DTO.ClassroomDashboardDTO;
import com.tracker.leetcode.tracker.DTO.CuratedProblemDTO;
import com.tracker.leetcode.tracker.DTO.StudentSummaryDTO;
import com.tracker.leetcode.tracker.DTO.TopicProficiencyDTO;
import com.tracker.leetcode.tracker.Exception.*;
import com.tracker.leetcode.tracker.Mapper.StudentMapper;
import com.tracker.leetcode.tracker.Models.*;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final MentorRepository mentorRepository;
    private final StudentRepository studentRepository;
    private final StudentMapper studentMapper;
    private final LeetCodeApiClient leetCodeApiClient;
    private final CodeforcesApiClient codeforcesApiClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisLeaderboardService redisLeaderboardService;
    private final RedisWebSocketBridge webSocketBridge;

    @Lazy
    @Autowired
    private CuratedTopicCatalog curatedTopicCatalog;

    @Lazy
    @Autowired
    private ClassroomService self;

    @Lazy
    @Autowired
    private StudentService studentService;

    @Lazy
    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("virtualThreadExecutor")
    private java.util.concurrent.Executor virtualThreadExecutor;

    // 1. Create Classroom
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics", "mentors-all", "mentor"}, allEntries = true)
    public Classroom createClassroom(String mentorId, String className) {
        log.info("Creating classroom {} for mentor ID: {}", className, mentorId);
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));

        Classroom classroom = new Classroom();
        classroom.setClassName(className);
        classroom.setMentorId(mentorId);
        Classroom savedClassroom = classroomRepository.save(classroom);

        mentor.getClassroomIds().add(savedClassroom.getId());
        mentorRepository.save(mentor);

        return savedClassroom;
    }

    /**
     * Checks if a student account was genuinely created on MentorSync through signup.
     * Genuine signed-up students have:
     * 1. A non-blank password (encoded during signup).
     * 2. A non-blank email that is not an auto-generated temporary placeholder (.local).
     */
    public static boolean isRegisteredStudent(Student student) {
        if (student == null) {
            return false;
        }
        boolean hasPassword = student.getPassword() != null && !student.getPassword().isBlank();
        boolean hasValidEmail = student.getEmail() != null
                && !student.getEmail().isBlank()
                && !student.getEmail().toLowerCase().endsWith("@student.mentorsync.local");
        return hasPassword && hasValidEmail;
    }

    /**
     * Looks up an existing, registered MentorSync student by email, LeetCode username,
     * Codeforces handle, or identifier (ID / username / handle).
     */
    public Optional<Student> findRegisteredStudent(String email, String lcUsername, String cfHandle, String genericId) {
        Student student = null;

        if (email != null && !email.isBlank()) {
            student = studentRepository.findByEmail(email.trim())
                    .or(() -> studentRepository.findByEmailIgnoreCase(email.trim()))
                    .orElse(null);
        }
        if (student == null && lcUsername != null && !lcUsername.isBlank()) {
            student = studentRepository.findByLeetcodeUsername(lcUsername.trim())
                    .or(() -> studentRepository.findByLeetcodeUsernameIgnoreCase(lcUsername.trim()))
                    .orElse(null);
        }
        if (student == null && cfHandle != null && !cfHandle.isBlank()) {
            student = studentRepository.findByCodeforcesHandle(cfHandle.trim())
                    .or(() -> studentRepository.findByCodeforcesHandleIgnoreCase(cfHandle.trim()))
                    .orElse(null);
        }
        if (student == null && genericId != null && !genericId.isBlank()) {
            String trimmedKey = genericId.trim();
            student = studentRepository.findById(trimmedKey)
                    .or(() -> studentRepository.findByEmail(trimmedKey))
                    .or(() -> studentRepository.findByEmailIgnoreCase(trimmedKey))
                    .or(() -> studentRepository.findByLeetcodeUsername(trimmedKey))
                    .or(() -> studentRepository.findByLeetcodeUsernameIgnoreCase(trimmedKey))
                    .or(() -> studentRepository.findByCodeforcesHandle(trimmedKey))
                    .or(() -> studentRepository.findByCodeforcesHandleIgnoreCase(trimmedKey))
                    .orElse(null);
        }

        if (student != null && isRegisteredStudent(student)) {
            return Optional.of(student);
        }
        return Optional.empty();
    }

    // 2. Add Student
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Classroom addStudentToClassroom(String classroomId, String identifier) {
        log.info("Adding student {} to classroom ID: {}", identifier, classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        String trimmed = identifier != null ? identifier.trim() : "";
        if (trimmed.isEmpty()) {
            throw new ValidationFailedException("Student identifier cannot be blank.");
        }

        String lcUsername = "";
        String cfHandle = "";
        String email = "";
        String lookupKey = trimmed;

        if (isCodeforcesUrl(trimmed)) {
            cfHandle = extractCodeforcesHandle(trimmed);
            lookupKey = cfHandle;
        } else if (isLeetCodeUrl(trimmed)) {
            lcUsername = extractLeetcodeUsername(trimmed);
            lookupKey = lcUsername;
        } else if (trimmed.contains("@") && !trimmed.startsWith("@")) {
            email = trimmed;
        } else {
            if (trimmed.startsWith("@")) {
                lookupKey = trimmed.substring(1).trim();
            }
            lcUsername = lookupKey;
        }

        if (lookupKey.isEmpty() && lcUsername.isEmpty() && cfHandle.isEmpty() && email.isEmpty()) {
            throw new ValidationFailedException("Invalid student identifier or URL provided.");
        }

        Student student = findRegisteredStudent(email, lcUsername, cfHandle, lookupKey).orElse(null);

        // Verification: Ensure that student has already created an account on MentorSync through signup
        if (student == null) {
            throw new StudentNotFoundException("Student '" + trimmed + "' has not created an account on MentorSync yet. Students must sign up on MentorSync before they can be added to a classroom.");
        }

        boolean studentModified = false;
        if (!lcUsername.isEmpty() && (student.getLeetcodeUsername() == null || student.getLeetcodeUsername().isBlank())) {
            student.setLeetcodeUsername(lcUsername);
            studentModified = true;
        }
        if (!cfHandle.isEmpty() && (student.getCodeforcesHandle() == null || student.getCodeforcesHandle().isBlank())) {
            student.setCodeforcesHandle(cfHandle);
            studentModified = true;
        }
        if (studentModified) {
            Student savedStudent = studentRepository.save(student);
            if (savedStudent != null) {
                student = savedStudent;
            }
        }

        // Prevent duplicate enrollments in the same class
        if (classroom.getStudentIds().contains(student.getId())) {
            throw new StudentAlreadyEnrolledException("Student is already enrolled in this classroom.");
        }

        classroom.getStudentIds().add(student.getId());
        Classroom saved = classroomRepository.save(classroom);
        webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "Student added: " + student.getName());
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Student added: " + student.getName())
        );

        final Student studentToSync = student;
        if (studentService != null) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    studentService.syncAllProfileData(studentToSync);
                } catch (Exception e) {
                    log.warn("Background profile sync failed for student [{}]: {}", studentToSync.getName(), e.getMessage());
                }
            }, virtualThreadExecutor != null ? virtualThreadExecutor : java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor());
        }

        return saved;
    }

    // 2. Add Student with mentor check
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Classroom addStudentToClassroom(String classroomId, String identifier, String mentorId) {
        if (mentorId != null && !mentorId.isBlank()) {
            Classroom classroom = classroomRepository.findById(classroomId)
                    .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));
            if (!classroom.getMentorId().equals(mentorId)) {
                log.warn("Security Alert: Mentor {} attempted to add student to classroom {} which they do not own.", mentorId, classroomId);
                throw new AccessDeniedException("You are not authorized to modify this classroom.");
            }
        }
        return addStudentToClassroom(classroomId, identifier);
    }

    // 2b. Remove Student from Classroom
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Classroom removeStudentFromClassroom(String classroomId, String studentIdentifier, String mentorId) {
        log.info("Removing student '{}' from classroom ID: {} by mentor {}", studentIdentifier, classroomId, mentorId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        if (mentorId != null && !mentorId.isBlank() && !classroom.getMentorId().equals(mentorId)) {
            log.warn("Security Alert: Mentor {} attempted to remove student from classroom {} which they do not own.", mentorId, classroomId);
            throw new AccessDeniedException("You are not authorized to modify this classroom.");
        }

        String trimmed = studentIdentifier != null ? studentIdentifier.trim() : "";
        if (trimmed.isEmpty()) {
            throw new ValidationFailedException("Student identifier cannot be blank.");
        }

        if (classroom.getStudentIds() == null || classroom.getStudentIds().isEmpty()) {
            throw new ValidationFailedException("No students are enrolled in this classroom.");
        }

        // 1. Resolve student ID
        String targetStudentId = null;
        String studentName = null;

        if (classroom.getStudentIds().contains(trimmed)) {
            targetStudentId = trimmed;
            Student s = studentRepository.findById(trimmed).orElse(null);
            if (s != null) studentName = s.getName();
        } else {
            String lcExtracted = isLeetCodeUrl(trimmed) ? extractLeetcodeUsername(trimmed) : "";
            String cfExtracted = isCodeforcesUrl(trimmed) ? extractCodeforcesHandle(trimmed) : "";

            Student student = null;
            if (!lcExtracted.isBlank()) {
                student = studentRepository.findByLeetcodeUsername(lcExtracted).orElse(null);
            } else if (!cfExtracted.isBlank()) {
                student = studentRepository.findByCodeforcesHandle(cfExtracted).orElse(null);
            }

            if (student == null) {
                final String lookup = trimmed.startsWith("@") ? trimmed.substring(1).trim() : trimmed;
                student = studentRepository.findById(lookup)
                        .or(() -> studentRepository.findByEmail(lookup))
                        .or(() -> studentRepository.findByLeetcodeUsername(lookup))
                        .or(() -> studentRepository.findByCodeforcesHandle(lookup))
                        .orElse(null);
            }

            if (student != null && classroom.getStudentIds().contains(student.getId())) {
                targetStudentId = student.getId();
                studentName = student.getName();
            }
        }

        if (targetStudentId == null) {
            throw new ValidationFailedException("Student '" + trimmed + "' is not enrolled in this classroom.");
        }

        // 2. Remove student from classroom list
        classroom.getStudentIds().remove(targetStudentId);
        Classroom saved = classroomRepository.save(classroom);

        // 3. Remove from Redis Leaderboard metric ZSets
        try {
            if (redisLeaderboardService != null) {
                redisLeaderboardService.removeStudentFromClassroom(classroomId, targetStudentId);
            }
        } catch (Exception ex) {
            log.warn("Failed removing student {} from Redis leaderboards: {}", targetStudentId, ex.getMessage());
        }

        // 4. Broadcast WebSocket & STOMP updates
        String displayName = studentName != null ? studentName : targetStudentId;
        webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "Student removed: " + displayName);
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Student removed: " + displayName)
        );

        return saved;
    }

    public Classroom removeStudentFromClassroom(String classroomId, String studentIdentifier) {
        return removeStudentFromClassroom(classroomId, studentIdentifier, null);
    }

    // 3. Get Dashboard (with Sorting & Fetching restored!)
    @Cacheable(value = "classroom-dashboard", key = "#classroomId + ':' + #sortBy")
    public ClassroomDashboardDTO getClassroomDashboard(String classroomId, String sortBy) {
        log.info("Fetching dashboard data for classroom ID: {} sorted by: {}", classroomId, sortBy);

        // 1. Fetch the data we need from MongoDB
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        Mentor mentor = mentorRepository.findById(classroom.getMentorId())
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found for this classroom."));

        List<Student> enrolledStudents = studentRepository.findAllById(classroom.getStudentIds());

        // 2. Map to DTOs in parallel for maximum multi-core throughput
        List<StudentSummaryDTO> studentSummaries = enrolledStudents.parallelStream()
                .map(student -> studentMapper.toSummaryDTO(student, classroom.getAssignments()))
                .collect(Collectors.toList());

        // 3. Apply Dynamic Sorting
        if (sortBy != null && !sortBy.isBlank()) {
            String normalized = sortBy.toLowerCase().trim();
            boolean isAscending = normalized.endsWith("_asc");
            boolean isExplicitDesc = normalized.endsWith("_desc");
            String field = normalized.replaceAll("_(asc|desc)$", "");

            Comparator<StudentSummaryDTO> comparator;
            switch (field) {
                case "consistency":
                case "streak":
                    comparator = Comparator.comparingInt(StudentSummaryDTO::getConsistencyStreak);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "rating":
                    // Maximum contest rating between LeetCode and Codeforces
                    comparator = Comparator.comparingDouble(s -> Math.max(
                            s.getCurrentContestRating(),
                            s.getCodeforcesRating() != null ? s.getCodeforcesRating().doubleValue() : 0.0
                    ));
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "lc_rating":
                case "leetcoderating":
                    comparator = Comparator.comparingDouble(StudentSummaryDTO::getCurrentContestRating);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "cf_rating":
                case "codeforcesrating":
                    comparator = Comparator.comparingDouble(s -> s.getCodeforcesRating() != null ? s.getCodeforcesRating().doubleValue() : 0.0);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "solved":
                case "totalsolved":
                    comparator = Comparator.comparingInt(StudentSummaryDTO::getTotalSolved);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "lc_solved":
                case "leetcodesolved":
                    comparator = Comparator.comparingInt(StudentSummaryDTO::getLeetcodeSolvedCount);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "cf_solved":
                case "codeforcessolved":
                    comparator = Comparator.comparingInt(StudentSummaryDTO::getCodeforcesSolvedCount);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "pending": // Sort by students who are falling behind
                    comparator = Comparator.comparingInt(StudentSummaryDTO::getPendingAssignments);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "completed": // Sort by students who finished the most assignments
                    comparator = Comparator.comparingInt(StudentSummaryDTO::getCompletedAssignments);
                    if (!isAscending) comparator = comparator.reversed();
                    break;

                case "name":
                    comparator = (s1, s2) -> {
                        String n1 = s1.getName() != null ? s1.getName() : "";
                        String n2 = s2.getName() != null ? s2.getName() : "";
                        return n1.compareToIgnoreCase(n2);
                    };
                    if (isExplicitDesc) {
                        comparator = comparator.reversed();
                    }
                    break;

                case "rank":
                    comparator = (s1, s2) -> {
                        int r1 = parseNumericalRank(s1.getRank());
                        int r2 = parseNumericalRank(s2.getRank());
                        return Integer.compare(r1, r2);
                    };
                    if (isExplicitDesc) {
                        comparator = comparator.reversed();
                    }
                    break;

                default:
                    log.warn("Unknown sort parameter: {}. Defaulting to unsorted.", sortBy);
                    comparator = null;
            }

            if (comparator != null) {
                studentSummaries.sort(comparator);
            }
        }

        // 4. Return the fully built Dashboard
        return ClassroomDashboardDTO.builder()
                .classroomId(classroom.getId())
                .className(classroom.getClassName())
                .mentorName(mentor.getName())
                .enrolledStudents(studentSummaries)
                .assignments(classroom.getAssignments() != null ? classroom.getAssignments() : new ArrayList<>())
                .build();
    }

    // 4. Assign a question to the classroom
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Classroom assignQuestionToClassroom(String classroomId, Assignment assignment) {
        log.info("Assigning question '{}' on platform {} to classroom ID: {}",
                assignment.getTitleSlug(), assignment.getPlatform(), classroomId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        if (assignment.getId() == null) {
            assignment.setId(UUID.randomUUID().toString());
        }

        // Extract problem info, problem number, and canonical links from whole URLs or slugs
        enrichAssignmentDetails(assignment);

        initializeAssignmentsIfNull(classroom);
        classroom.getAssignments().add(assignment);
        Classroom savedClassroom = classroomRepository.save(classroom);

        // Broadcast assignment update to all connected students and mentors
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "New assignment added!")
        );
        webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "New assignment added!");

        return savedClassroom;
    }

    public void enrichAssignmentDetails(Assignment assignment) {
        if (assignment == null) return;

        // 1. Ensure canonical question link and platform detection
        assignment.ensureQuestionLink();

        // 2. Extract and enrich problem info & problem number for both platforms
        if (assignment.getPlatform() == Platform.CODEFORCES) {
            // Parse contest ID and problem index from titleSlug or questionLink
            Pattern cfPattern = Pattern.compile("^(\\d+)([A-Za-z0-9]+)$");
            Matcher matcher = cfPattern.matcher(assignment.getTitleSlug() != null ? assignment.getTitleSlug().trim().toUpperCase() : "");
            if (matcher.find()) {
                int contestId = Integer.parseInt(matcher.group(1));
                String index = matcher.group(2);
                if (assignment.getProblemNumber() == null || assignment.getProblemNumber().isBlank()) {
                    assignment.setProblemNumber(contestId + index);
                }

                // If title is missing or default, fetch real problem title from Codeforces
                if (assignment.getTitle() == null || assignment.getTitle().isBlank() ||
                        assignment.getTitle().equalsIgnoreCase(assignment.getTitleSlug()) ||
                        assignment.getTitle().equalsIgnoreCase("Problem " + contestId + index)) {
                    try {
                        CodeforcesApiClient.CodeforcesProblemInfo cfInfo = codeforcesApiClient.fetchProblemDetails(contestId, index);
                        if (cfInfo != null && cfInfo.title() != null && !cfInfo.title().isBlank()) {
                            assignment.setTitle(cfInfo.title());
                        } else if (assignment.getTitle() == null || assignment.getTitle().isBlank()) {
                            assignment.setTitle("Problem " + contestId + index);
                        }
                    } catch (Exception e) {
                        if (assignment.getTitle() == null || assignment.getTitle().isBlank()) {
                            assignment.setTitle("Problem " + contestId + index);
                        }
                    }
                }
            }
        } else {
            // LeetCode: fetch problem number (questionFrontendId) and official title
            String slug = assignment.getTitleSlug();
            if (slug != null && !slug.isBlank()) {
                try {
                    LeetCodeApiClient.LeetCodeQuestionInfo lcInfo = leetCodeApiClient.fetchQuestionDetails(slug);
                    if (lcInfo != null) {
                        if (assignment.getProblemNumber() == null || assignment.getProblemNumber().isBlank()) {
                            assignment.setProblemNumber(lcInfo.problemNumber());
                        }
                        if (assignment.getTitle() == null || assignment.getTitle().isBlank() ||
                                assignment.getTitle().equalsIgnoreCase(slug) ||
                                assignment.getTitle().equalsIgnoreCase(humanizeSlug(slug))) {
                            assignment.setTitle(lcInfo.title());
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not enrich LeetCode question details: {}", e.getMessage());
                }

                if (assignment.getTitle() == null || assignment.getTitle().isBlank()) {
                    assignment.setTitle(humanizeSlug(slug));
                }
            }
        }
    }

    private String humanizeSlug(String slug) {
        if (slug == null) return "";
        String[] parts = slug.replace("-", " ").replace("_", " ").split("\\s+");
        StringBuilder sb = new StringBuilder();
        java.util.Set<String> romanNumerals = java.util.Set.of("i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x");
        java.util.Set<String> acronyms = java.util.Set.of("lru", "lfu", "bst", "trie", "sql", "dp", "bfs", "dfs", "gcd", "lcm");
        for (String part : parts) {
            if (!part.isEmpty()) {
                String lower = part.toLowerCase();
                if (romanNumerals.contains(lower) || acronyms.contains(lower)) {
                    sb.append(lower.toUpperCase()).append(" ");
                } else {
                    sb.append(Character.toUpperCase(part.charAt(0)))
                      .append(part.substring(1).toLowerCase())
                      .append(" ");
                }
            }
        }
        return sb.toString().trim();
    }

    // Helper method to extract submission ID from full LeetCode submission URL
    private String extractSubmissionIdFromUrl(String submissionUrl) {
        if (submissionUrl == null || submissionUrl.isBlank()) {
            throw new ValidationFailedException("Please provide a valid submission URL.");
        }

        String trimmed = submissionUrl.trim();

        // Reject Codeforces URL when validating LeetCode
        if (trimmed.toLowerCase().contains("codeforces.com")) {
            throw new ValidationFailedException("You provided a Codeforces URL, but this assignment is on LeetCode.");
        }

        Pattern pattern = Pattern.compile("(?i)submissions/(?:detail/)?(\\d+)");
        Matcher matcher = pattern.matcher(trimmed);
        if (!matcher.find()) {
            throw new ValidationFailedException("Invalid LeetCode submission URL. Please paste the full URL of your accepted submission (e.g. https://leetcode.com/problems/two-sum/submissions/123456789/).");
        }
        return matcher.group(1);
    }

    // Helper method to initialize assignments list if null
    private void initializeAssignmentsIfNull(Classroom classroom) {
        if (classroom.getAssignments() == null) {
            classroom.setAssignments(new ArrayList<>());
        }
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Student validateManualSubmission(String classroomId, String studentIdentifier, String assignmentId, String submissionUrl) {
        log.info("Validating manual submission for {} on assignment {}", studentIdentifier, assignmentId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found"));

        Assignment assignment = classroom.getAssignments().stream()
                .filter(a -> a.getId().equals(assignmentId))
                .findFirst()
                .orElseThrow(() -> new AssignmentNotFoundException("Assignment not found in this classroom."));

        String trimmed = studentIdentifier != null ? studentIdentifier.trim() : "";
        String lcExtracted = isLeetCodeUrl(trimmed) ? extractLeetcodeUsername(trimmed) : "";
        String cfExtracted = isCodeforcesUrl(trimmed) ? extractCodeforcesHandle(trimmed) : "";
        final String lookup = trimmed.startsWith("@") ? trimmed.substring(1).trim() : trimmed;

        Student student = studentRepository.findById(lookup)
                .or(() -> studentRepository.findByEmail(lookup))
                .or(() -> studentRepository.findByLeetcodeUsername(lookup))
                .or(() -> studentRepository.findByCodeforcesHandle(lookup))
                .or(() -> !lcExtracted.isBlank() ? studentRepository.findByLeetcodeUsername(lcExtracted) : Optional.empty())
                .or(() -> !cfExtracted.isBlank() ? studentRepository.findByCodeforcesHandle(cfExtracted) : Optional.empty())
                .orElseThrow(() -> new StudentNotFoundException("Student not found."));

        // If they already validated it, skip the network call and return
        if (student.getManuallyCompletedAssignments().contains(assignmentId)) {
            log.info("Assignment {} already validated for {}", assignmentId, studentIdentifier);
            return student;
        }

        boolean isValid = verifyAssignmentSubmission(student, assignment, submissionUrl);

        if (!isValid) {
            throw new ValidationFailedException("Validation Failed! Ensure the submission is 'Accepted', belongs to you, and is for the correct problem.");
        }

        // Success! Permanently save it to the student's profile
        student.getManuallyCompletedAssignments().add(assignmentId);
        Student savedStudent = studentRepository.save(student);

        // Update real-time Redis leaderboard
        updateStudentInRedisLeaderboards(savedStudent, classroomId);

        // Broadcast the update via Redis Pub/Sub WebSocket bridge
        webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "Leaderboard changed!");

        return savedStudent;
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Student validateSubmissionAsStudent(Student student, String classroomId, String assignmentId, String submissionUrl) {
        log.info("Student {} is self-validating assignment {}", student.getName(), assignmentId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not Found."));

        if (!classroom.getStudentIds().contains(student.getId())) {
            throw new AccessDeniedException("You are not enrolled in this classroom.");
        }

        Assignment assignment = classroom.getAssignments().stream()
                .filter(a -> a.getId().equals(assignmentId))
                .findFirst()
                .orElseThrow(() -> new AssignmentNotFoundException("Assignment not found in this classroom."));

        // If they already validated it, skip the network call
        if (student.getManuallyCompletedAssignments().contains(assignmentId)) {
            log.info("Assignment {} already validated for {}", assignmentId, student.getName());
            return student;
        }

        boolean isValid = verifyAssignmentSubmission(student, assignment, submissionUrl);

        if (!isValid) {
            throw new ValidationFailedException("Validation Failed! Ensure the submission is 'Accepted', belongs to you, and is the correct problem.");
        }

        // Success! Save it to the student's profile
        student.getManuallyCompletedAssignments().add(assignmentId);
        Student savedStudent = studentRepository.save(student);

        // Update real-time Redis leaderboard
        updateStudentInRedisLeaderboards(savedStudent, classroomId);

        // Broadcast the update to anyone listening to this classroom via Redis Pub/Sub
        log.info("Broadcasting leaderboard update for classroom: {}", classroomId);
        webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "Leaderboard changed!");

        return savedStudent;
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Student autoValidateAssignment(Student student, String classroomId, String assignmentId) {
        return validateSubmissionAsStudent(student, classroomId, assignmentId, null);
    }

    private boolean verifyAssignmentSubmission(Student student, Assignment assignment, String submissionUrl) {
        if (assignment.getPlatform() == Platform.CODEFORCES) {
            if (student.getCodeforcesHandle() == null || student.getCodeforcesHandle().isBlank()) {
                throw new ValidationFailedException("You must link a Codeforces handle to your profile to validate Codeforces assignments.");
            }
            if (submissionUrl != null && !submissionUrl.isBlank()) {
                if (submissionUrl.toLowerCase().contains("leetcode.com")) {
                    throw new ValidationFailedException("You provided a LeetCode URL, but this assignment is on Codeforces.");
                }
            }
            return codeforcesApiClient.verifySubmission(student.getCodeforcesHandle(), assignment.getTitleSlug(), submissionUrl);
        } else {
            // LeetCode verification
            if (student.getLeetcodeUsername() == null || student.getLeetcodeUsername().isBlank()) {
                throw new ValidationFailedException("You must link a LeetCode username to your profile to validate LeetCode assignments.");
            }

            if (submissionUrl != null && !submissionUrl.isBlank()) {
                // Check if problem slug in the URL mismatches assignment
                Pattern slugPattern = Pattern.compile("(?i)problems/([a-zA-Z0-9_-]+)/submissions");
                Matcher slugMatcher = slugPattern.matcher(submissionUrl);
                if (slugMatcher.find()) {
                    String urlSlug = slugMatcher.group(1);
                    if (!StudentService.isProblemSlugMatch(urlSlug, assignment.getTitleSlug())) {
                        throw new ValidationFailedException("This submission URL is for problem '" + urlSlug +
                                "', but this assignment is for problem '" + assignment.getTitleSlug() + "'.");
                    }
                }

                String submissionId = extractSubmissionIdFromUrl(submissionUrl);
                boolean verified = leetCodeApiClient.verifySubmission(submissionId, student.getLeetcodeUsername(), assignment.getTitleSlug());
                if (!verified) {
                    throw new ValidationFailedException("Could not verify submission #" + submissionId +
                            " on LeetCode for @" + student.getLeetcodeUsername() + ". Ensure the submission is 'Accepted' and was submitted by your account.");
                }
                return true;
            } else {
                // Auto-validate LeetCode assignment:
                // 1. First check existing recent submissions in database
                boolean matched = student.getRecentSubmissions() != null && student.getRecentSubmissions().stream()
                        .anyMatch(sub -> (sub.getPlatform() == null || sub.getPlatform() == Platform.LEETCODE)
                                && StudentService.isProblemSlugMatch(sub.getTitleSlug(), assignment.getTitleSlug()));

                if (matched) {
                    return true;
                }

                // 2. If not found in DB, fetch fresh recent submissions directly from LeetCode
                try {
                    List<RecentSubmission> fresh = leetCodeApiClient.fetchRecentSubmissions(student.getLeetcodeUsername(), 20);
                    if (fresh != null && !fresh.isEmpty()) {
                        List<RecentSubmission> existing = student.getRecentSubmissions() != null
                                ? new ArrayList<>(student.getRecentSubmissions())
                                : new ArrayList<>();

                        for (RecentSubmission r : fresh) {
                            if (existing.stream().noneMatch(e -> e.getTitleSlug() != null && e.getTitleSlug().equalsIgnoreCase(r.getTitleSlug()) && e.getTimestamp() == r.getTimestamp())) {
                                existing.add(0, r);
                            }
                        }
                        student.setRecentSubmissions(existing);

                        return fresh.stream().anyMatch(sub -> StudentService.isProblemSlugMatch(sub.getTitleSlug(), assignment.getTitleSlug()));
                    }
                } catch (Exception e) {
                    log.warn("Could not query fresh LeetCode submissions during auto-validation: {}", e.getMessage());
                }

                return false;
            }
        }
    }

    /**
     * Automatically validates all pending assignments across all classrooms for a student.
     * Called whenever a student visits their dashboard, so they never need to do manual validation.
     */
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public void autoValidatePendingAssignmentsForStudent(Student student) {
        try {
            List<Classroom> classrooms = classroomRepository.findByStudentIdsContaining(student.getId());
            if (classrooms == null || classrooms.isEmpty()) return;

            if (student.getManuallyCompletedAssignments() == null) {
                student.setManuallyCompletedAssignments(new ArrayList<>());
            }

            // Collect all uncompleted assignments across all enrolled classrooms
            List<Assignment> pending = new ArrayList<>();
            for (Classroom c : classrooms) {
                if (c.getAssignments() == null) continue;
                for (Assignment a : c.getAssignments()) {
                    if (!student.getManuallyCompletedAssignments().contains(a.getId())) {
                        pending.add(a);
                    }
                }
            }

            if (pending.isEmpty()) return;

            // Fetch fresh LeetCode submissions if there are pending LeetCode assignments
            boolean hasLCPending = pending.stream().anyMatch(a -> a.getPlatform() == Platform.LEETCODE || a.getPlatform() == null);
            if (hasLCPending && student.getLeetcodeUsername() != null && !student.getLeetcodeUsername().isBlank()) {
                try {
                    List<RecentSubmission> fresh = leetCodeApiClient.fetchRecentSubmissions(student.getLeetcodeUsername(), 20);
                    if (fresh != null && !fresh.isEmpty()) {
                        List<RecentSubmission> existing = student.getRecentSubmissions() != null
                                ? new ArrayList<>(student.getRecentSubmissions())
                                : new ArrayList<>();
                        for (RecentSubmission r : fresh) {
                            if (existing.stream().noneMatch(e -> e.getTitleSlug() != null && e.getTitleSlug().equalsIgnoreCase(r.getTitleSlug()) && e.getTimestamp() == r.getTimestamp())) {
                                existing.add(0, r);
                            }
                        }
                        student.setRecentSubmissions(existing);
                    }
                } catch (Exception e) {
                    log.debug("Auto-validation: LC fetch skipped: {}", e.getMessage());
                }
            }

            boolean updated = false;

            for (Assignment assignment : pending) {
                boolean isCompleted = false;

                if (assignment.getPlatform() == Platform.CODEFORCES) {
                    if (student.getCodeforcesHandle() != null && !student.getCodeforcesHandle().isBlank()) {
                        isCompleted = codeforcesApiClient.verifySubmission(student.getCodeforcesHandle(), assignment.getTitleSlug(), null);
                    }
                } else {
                    if (student.getRecentSubmissions() != null) {
                        isCompleted = student.getRecentSubmissions().stream()
                                .anyMatch(sub -> (sub.getPlatform() == null || sub.getPlatform() == Platform.LEETCODE)
                                        && StudentService.isProblemSlugMatch(sub.getTitleSlug(), assignment.getTitleSlug()));
                    }
                }

                if (isCompleted) {
                    student.getManuallyCompletedAssignments().add(assignment.getId());
                    updated = true;
                    log.info("Auto-validated assignment [{}] ({}) for student [{}]",
                            assignment.getTitleSlug(), assignment.getPlatform(), student.getName());
                }
            }

            if (updated) {
                Student saved = studentRepository.save(student);
                List<String> classroomIds = classrooms.stream().map(Classroom::getId).toList();
                updateStudentInRedisLeaderboards(saved, classroomIds);

                for (Classroom classroom : classrooms) {
                    webSocketBridge.broadcastClassroomUpdate(classroom.getId(), "UPDATE", "Assignment auto-validated!");
                }
            }
        } catch (Exception e) {
            log.warn("Error during auto-validation of pending assignments for student {}: {}", student.getId(), e.getMessage());
        }
    }


    // 1. BULK IMPORT: Read CSV and add students
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public BulkImportResponseDTO bulkAddStudents(String classroomId, MultipartFile file) {
        log.info("Starting bulk CSV student import for classroom ID: {}", classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        if (file == null || file.isEmpty()) {
            throw new ValidationFailedException("Uploaded CSV file is empty.");
        }

        BulkImportResponseDTO result = new BulkImportResponseDTO();
        List<Student> studentsToSync = new ArrayList<>();
        boolean classroomUpdated = false;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            List<String> rawLines = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    rawLines.add(line);
                }
            }

            if (rawLines.isEmpty()) {
                throw new ValidationFailedException("CSV file contains no data.");
            }

            // Detect delimiter from the first line
            char delimiter = detectDelimiter(rawLines.get(0));

            // Parse header if present
            List<String> firstRow = parseCsvLine(rawLines.get(0), delimiter);
            int nameIdx = -1, emailIdx = -1, lcIdx = -1, cfIdx = -1, genericIdx = -1;
            boolean hasHeader = false;

            for (int i = 0; i < firstRow.size(); i++) {
                String col = cleanHeader(firstRow.get(i));
                if (col.equals("name") || col.equals("fullname") || col.equals("studentname") || col.equals("student")) {
                    nameIdx = i; hasHeader = true;
                } else if (col.equals("email") || col.equals("studentemail") || col.equals("emailaddress") || col.equals("mail")) {
                    emailIdx = i; hasHeader = true;
                } else if (col.equals("leetcode") || col.equals("leetcodeusername") || col.equals("lc") || col.equals("lcusername") || col.equals("leetcodehandle")) {
                    lcIdx = i; hasHeader = true;
                } else if (col.equals("codeforces") || col.equals("codeforceshandle") || col.equals("cf") || col.equals("cfhandle") || col.equals("codeforcesusername")) {
                    cfIdx = i; hasHeader = true;
                } else if (col.equals("username") || col.equals("handle") || col.equals("identifier") || col.equals("id")) {
                    genericIdx = i; hasHeader = true;
                }
            }

            int startIndex = hasHeader ? 1 : 0;
            result.setTotalProcessed(rawLines.size() - startIndex);

            for (int lineNum = startIndex; lineNum < rawLines.size(); lineNum++) {
                String currentLine = rawLines.get(lineNum);
                List<String> cols = parseCsvLine(currentLine, delimiter);
                if (cols.isEmpty() || cols.stream().allMatch(String::isBlank)) {
                    continue;
                }

                String name = "";
                String email = "";
                String lcUsername = "";
                String cfHandle = "";
                String genericId = "";

                if (hasHeader) {
                    if (nameIdx >= 0 && nameIdx < cols.size()) name = cols.get(nameIdx).trim();
                    if (emailIdx >= 0 && emailIdx < cols.size()) email = cols.get(emailIdx).trim();
                    if (lcIdx >= 0 && lcIdx < cols.size()) lcUsername = cols.get(lcIdx).trim();
                    if (cfIdx >= 0 && cfIdx < cols.size()) cfHandle = cols.get(cfIdx).trim();
                    if (genericIdx >= 0 && genericIdx < cols.size()) genericId = cols.get(genericIdx).trim();
                } else {
                    // Positional mapping
                    if (cols.size() == 1) {
                        genericId = cols.get(0).trim();
                    } else if (cols.size() == 2) {
                        lcUsername = cols.get(0).trim();
                        cfHandle = cols.get(1).trim();
                    } else if (cols.size() == 3) {
                        name = cols.get(0).trim();
                        lcUsername = cols.get(1).trim();
                        cfHandle = cols.get(2).trim();
                    } else {
                        name = cols.get(0).trim();
                        email = cols.get(1).trim();
                        lcUsername = cols.get(2).trim();
                        cfHandle = cols.get(3).trim();
                    }
                }

                // Cross-platform URL detection and correction
                boolean lcHasCf = isCodeforcesUrl(lcUsername);
                boolean cfHasLc = isLeetCodeUrl(cfHandle);

                if (lcHasCf && cfHasLc) {
                    // Both columns were swapped
                    String temp = lcUsername;
                    lcUsername = cfHandle;
                    cfHandle = temp;
                } else if (lcHasCf && (cfHandle.isBlank() || isCodeforcesUrl(cfHandle))) {
                    if (cfHandle.isBlank()) {
                        cfHandle = lcUsername;
                        lcUsername = "";
                    }
                } else if (cfHasLc && (lcUsername.isBlank() || isLeetCodeUrl(lcUsername))) {
                    if (lcUsername.isBlank()) {
                        lcUsername = cfHandle;
                        cfHandle = "";
                    }
                }

                // If generic identifier provided, resolve type
                if (lcUsername.isBlank() && cfHandle.isBlank() && !genericId.isBlank()) {
                    if (isCodeforcesUrl(genericId)) {
                        cfHandle = extractCodeforcesHandle(genericId);
                    } else if (isLeetCodeUrl(genericId)) {
                        lcUsername = extractLeetcodeUsername(genericId);
                    } else if (genericId.contains("@") && !genericId.startsWith("@")) {
                        email = genericId;
                    } else {
                        String cleaned = genericId.startsWith("@") ? genericId.substring(1).trim() : genericId.trim();
                        lcUsername = cleaned;
                    }
                }

                // Clean handles and auto-extract usernames/handles from profile URLs
                if (!lcUsername.isBlank()) {
                    lcUsername = extractLeetcodeUsername(lcUsername);
                }
                if (!cfHandle.isBlank()) {
                    cfHandle = extractCodeforcesHandle(cfHandle);
                }

                if (name.isBlank() && email.isBlank() && lcUsername.isBlank() && cfHandle.isBlank()) {
                    result.setFailedCount(result.getFailedCount() + 1);
                    result.getFailures().add("Row " + (lineNum + 1) + ": Empty or invalid student data");
                    continue;
                }

                try {
                    // Look up existing registered student in MentorSync database
                    Optional<Student> registeredOpt = findRegisteredStudent(email, lcUsername, cfHandle, genericId);

                    if (registeredOpt.isPresent()) {
                        Student student = registeredOpt.get();
                        boolean studentModified = false;
                        if ((student.getName() == null || student.getName().isBlank()) && !name.isBlank()) {
                            student.setName(name);
                            studentModified = true;
                        }
                        if ((student.getCodeforcesHandle() == null || student.getCodeforcesHandle().isBlank()) && !cfHandle.isBlank()) {
                            student.setCodeforcesHandle(cfHandle);
                            studentModified = true;
                        }
                        if ((student.getLeetcodeUsername() == null || student.getLeetcodeUsername().isBlank()) && !lcUsername.isBlank()) {
                            student.setLeetcodeUsername(lcUsername);
                            studentModified = true;
                        }
                        if (studentModified) {
                            Student savedStudent = studentRepository.save(student);
                            if (savedStudent != null) {
                                student = savedStudent;
                            }
                        }

                        // Check enrollment
                        if (classroom.getStudentIds().contains(student.getId())) {
                            result.setAlreadyEnrolledCount(result.getAlreadyEnrolledCount() + 1);
                            result.getAlreadyEnrolledStudents().add(student.getName() != null ? student.getName() : student.getId());
                        } else {
                            classroom.getStudentIds().add(student.getId());
                            classroomUpdated = true;
                            result.setAddedCount(result.getAddedCount() + 1);
                            result.getAddedStudents().add(student.getName() != null ? student.getName() : student.getId());
                            studentsToSync.add(student);
                        }
                    } else {
                        // The student has not created an account on MentorSync through signup!
                        // Do NOT provision a dummy account.
                        result.setFailedCount(result.getFailedCount() + 1);
                        String idDisplay = !name.isBlank() ? name
                                : !lcUsername.isBlank() ? lcUsername
                                : !cfHandle.isBlank() ? cfHandle
                                : !email.isBlank() ? email
                                : !genericId.isBlank() ? genericId
                                : "Row " + (lineNum + 1);
                        result.getFailures().add(idDisplay + ": Student has not created an account on MentorSync yet. Students must sign up on MentorSync before they can be added to a classroom.");
                    }
                } catch (Exception ex) {
                    log.warn("Error importing row {}: {}", lineNum + 1, ex.getMessage());
                    result.setFailedCount(result.getFailedCount() + 1);
                    String idDisplay = !lcUsername.isBlank() ? lcUsername : !cfHandle.isBlank() ? cfHandle : !email.isBlank() ? email : "Row " + (lineNum + 1);
                    result.getFailures().add(idDisplay + ": " + ex.getMessage());
                }
            }

            if (classroomUpdated) {
                classroomRepository.save(classroom);
                webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "Bulk students imported successfully");
            }

            // Background parallel sync newly provisioned profiles using Virtual Threads
            if (studentService != null && !studentsToSync.isEmpty()) {
                final List<Student> studentsCopy = new ArrayList<>(studentsToSync);
                Thread.ofVirtual().name("bulk-csv-sync-", 1).start(() -> {
                    log.info("Starting virtual thread parallel sync for {} students in classroom [{}]", studentsCopy.size(), classroomId);
                    java.util.concurrent.Semaphore semaphore = new java.util.concurrent.Semaphore(6);
                    List<CompletableFuture<Void>> futures = new ArrayList<>();

                    for (Student s : studentsCopy) {
                        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                            try {
                                semaphore.acquire();
                                try {
                                    studentService.syncAllProfileData(s);
                                } finally {
                                    semaphore.release();
                                }
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            } catch (Exception e) {
                                log.warn("Async profile sync error for {}: {}", s.getId(), e.getMessage());
                            }
                        }, virtualThreadExecutor != null ? virtualThreadExecutor : java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor());
                        futures.add(future);
                    }

                    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                    log.info("Completed virtual thread parallel sync for {} students in classroom [{}]", studentsCopy.size(), classroomId);
                    webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "All imported student profiles synced successfully!");
                });
            }

        } catch (Exception e) {
            log.error("Failed to parse uploaded CSV file for classroom [{}]: {}", classroomId, e.getMessage());
            throw new ValidationFailedException("Failed to parse CSV file: " + e.getMessage());
        }

        return result;
    }

    // 2. EXPORT: Generate comprehensive CSV string of the leaderboard
    public String generateClassroomCsv(String classroomId) {
        ClassroomDashboardDTO dashboard = self.getClassroomDashboard(classroomId, "solved");

        StringBuilder csv = new StringBuilder();
        csv.append("Rank,Name,Email,LeetCode Username,Codeforces Handle,Daily Streak,Total Solved,LC Solved,CF Solved,LC Rating,LC Global Rank,CF Rating,CF Max Rating,CF Rank,Done Assignments,Pending Assignments\n");

        int rank = 1;
        for (StudentSummaryDTO s : dashboard.getEnrolledStudents()) {
            csv.append(rank++).append(",")
                    .append("\"").append(s.getName() != null ? s.getName().replace("\"", "\"\"") : "").append("\",")
                    .append("\"").append(s.getEmail() != null ? s.getEmail().replace("\"", "\"\"") : "").append("\",")
                    .append(s.getLeetcodeUsername() != null ? s.getLeetcodeUsername() : "").append(",")
                    .append(s.getCodeforcesHandle() != null ? s.getCodeforcesHandle() : "").append(",")
                    .append(s.getConsistencyStreak()).append(",")
                    .append(s.getTotalSolved()).append(",")
                    .append(s.getLeetcodeSolvedCount()).append(",")
                    .append(s.getCodeforcesSolvedCount()).append(",")
                    .append(Math.round(s.getCurrentContestRating())).append(",")
                    .append("\"").append(s.getRank() != null ? s.getRank() : "").append("\",")
                    .append(s.getCodeforcesRating() != null ? s.getCodeforcesRating() : 0).append(",")
                    .append(s.getCodeforcesMaxRating() != null ? s.getCodeforcesMaxRating() : 0).append(",")
                    .append("\"").append(s.getCodeforcesRank() != null ? s.getCodeforcesRank() : "").append("\",")
                    .append(s.getCompletedAssignments()).append(",")
                    .append(s.getPendingAssignments()).append("\n");
        }
        return csv.toString();
    }

    // 2b. EXPORT: Generate Assignment Completion Matrix CSV for classroom
    public String generateClassroomAssignmentMatrixCsv(String classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));
        List<Student> students = studentRepository.findAllById(classroom.getStudentIds());
        List<Assignment> assignments = classroom.getAssignments() != null ? classroom.getAssignments() : Collections.emptyList();

        StringBuilder csv = new StringBuilder();
        csv.append("Student Name,Email,LeetCode Username,Codeforces Handle,Completed Assignments,Pending Assignments");
        for (Assignment a : assignments) {
            String title = a.getTitle() != null && !a.getTitle().isBlank() ? a.getTitle() : a.getTitleSlug();
            csv.append(",\"").append(title.replace("\"", "\"\""))
                    .append(" (").append(a.getPlatform() != null ? a.getPlatform().name() : "LC").append(")\"");
        }
        csv.append("\n");

        List<String> rows = students.parallelStream().map(s -> {
            int completed = 0;
            int pending = 0;
            List<String> statuses = new ArrayList<>();
            for (Assignment a : assignments) {
                boolean isDone = s.getManuallyCompletedAssignments() != null && s.getManuallyCompletedAssignments().contains(a.getId());
                if (!isDone && s.getRecentSubmissions() != null) {
                    String normTarget = a.getTitleSlug() != null ? a.getTitleSlug().replace("-", "").toLowerCase() : "";
                    isDone = s.getRecentSubmissions().stream().anyMatch(sub -> {
                        String normSub = sub.getTitleSlug() != null ? sub.getTitleSlug().replace("-", "").toLowerCase() : "";
                        return normSub.equals(normTarget);
                    });
                }
                if (isDone) {
                    completed++;
                    statuses.add("COMPLETED");
                } else {
                    pending++;
                    statuses.add("PENDING");
                }
            }

            StringBuilder row = new StringBuilder();
            row.append("\"").append(s.getName() != null ? s.getName().replace("\"", "\"\"") : "").append("\",")
                    .append("\"").append(s.getEmail() != null ? s.getEmail().replace("\"", "\"\"") : "").append("\",")
                    .append(s.getLeetcodeUsername() != null ? s.getLeetcodeUsername() : "").append(",")
                    .append(s.getCodeforcesHandle() != null ? s.getCodeforcesHandle() : "").append(",")
                    .append(completed).append(",")
                    .append(pending);

            for (String status : statuses) {
                row.append(",").append(status);
            }
            return row.toString();
        }).collect(Collectors.toList());

        for (String row : rows) {
            csv.append(row).append("\n");
        }

        return csv.toString();
    }

    // 2c. Sample CSV Template for Mentors
    public String generateStudentTemplateCsv() {
        return "Name,Email,LeetCode Username,Codeforces Handle\n" +
                "Alex Turner,alex@example.com,https://leetcode.com/u/alex_turner,https://codeforces.com/profile/alex_cf\n" +
                "Sarah Connor,sarah@example.com,https://leetcode.com/sarah_c,\n" +
                "David Miller,david@example.com,,david_cf\n";
    }

    public static boolean isLeetCodeUrl(String input) {
        if (input == null || input.isBlank()) return false;
        String lower = input.toLowerCase().trim();
        return lower.contains("leetcode.com") || lower.contains("leetcode.cn");
    }

    public static boolean isCodeforcesUrl(String input) {
        if (input == null || input.isBlank()) return false;
        String lower = input.toLowerCase().trim();
        return lower.contains("codeforces.com") || lower.contains("codeforces.net") || lower.contains("codeforces.org");
    }

    public static String extractLeetcodeUsername(String input) {
        if (input == null || input.isBlank()) return "";
        String s = input.trim();

        if (isLeetCodeUrl(s)) {
            int qIdx = s.indexOf('?');
            if (qIdx >= 0) s = s.substring(0, qIdx);
            int hIdx = s.indexOf('#');
            if (hIdx >= 0) s = s.substring(0, hIdx);
            s = s.trim();

            String lower = s.toLowerCase();
            if (lower.contains("/problems/") || lower.contains("/contest/") || lower.contains("/discuss/") || lower.contains("/tag/")) {
                return "";
            }

            Pattern lcPattern = Pattern.compile("(?:leetcode\\.(?:com|cn))/(?:u/)?([a-zA-Z0-9_-]+)/?", Pattern.CASE_INSENSITIVE);
            Matcher m = lcPattern.matcher(s);
            if (m.find()) {
                String candidate = m.group(1);
                if (!candidate.equalsIgnoreCase("u") && !candidate.equalsIgnoreCase("problems") && !candidate.equalsIgnoreCase("contest")) {
                    return candidate;
                }
            }

            while (s.endsWith("/")) {
                s = s.substring(0, s.length() - 1);
            }
            int lastSlash = s.lastIndexOf('/');
            if (lastSlash >= 0) {
                String candidate = s.substring(lastSlash + 1);
                if (!candidate.equalsIgnoreCase("u")) {
                    return candidate.replaceAll("[^a-zA-Z0-9_-]", "");
                }
            }
        }

        if (s.startsWith("@")) {
            s = s.substring(1).trim();
        }

        while (s.endsWith("/")) {
            s = s.substring(0, s.length() - 1).trim();
        }

        int qIdx = s.indexOf('?');
        if (qIdx >= 0) s = s.substring(0, qIdx);
        int hIdx = s.indexOf('#');
        if (hIdx >= 0) s = s.substring(0, hIdx);

        return s.trim();
    }

    public static String extractCodeforcesHandle(String input) {
        if (input == null || input.isBlank()) return "";
        String s = input.trim();

        if (isCodeforcesUrl(s)) {
            int qIdx = s.indexOf('?');
            if (qIdx >= 0) s = s.substring(0, qIdx);
            int hIdx = s.indexOf('#');
            if (hIdx >= 0) s = s.substring(0, hIdx);
            s = s.trim();

            String lower = s.toLowerCase();
            if (lower.contains("/problemset/") || lower.contains("/contest/") || lower.contains("/gym/") || lower.contains("/blog/")) {
                return "";
            }

            Pattern cfPattern = Pattern.compile("(?:codeforces\\.(?:com|net|org))/(?:profile/)?([a-zA-Z0-9_.-]+)/?", Pattern.CASE_INSENSITIVE);
            Matcher m = cfPattern.matcher(s);
            if (m.find()) {
                String candidate = m.group(1);
                if (!candidate.equalsIgnoreCase("profile") && !candidate.equalsIgnoreCase("problemset") && !candidate.equalsIgnoreCase("contest")) {
                    return candidate;
                }
            }

            while (s.endsWith("/")) {
                s = s.substring(0, s.length() - 1);
            }
            int lastSlash = s.lastIndexOf('/');
            if (lastSlash >= 0) {
                String candidate = s.substring(lastSlash + 1);
                if (!candidate.equalsIgnoreCase("profile")) {
                    return candidate.replaceAll("[^a-zA-Z0-9_.-]", "");
                }
            }
        }

        if (s.startsWith("@")) {
            s = s.substring(1).trim();
        }

        while (s.endsWith("/")) {
            s = s.substring(0, s.length() - 1).trim();
        }

        int qIdx = s.indexOf('?');
        if (qIdx >= 0) s = s.substring(0, qIdx);
        int hIdx = s.indexOf('#');
        if (hIdx >= 0) s = s.substring(0, hIdx);

        return s.trim();
    }

    public String extractHandleFromUrl(String url) {
        if (isCodeforcesUrl(url)) {
            return extractCodeforcesHandle(url);
        }
        return extractLeetcodeUsername(url);
    }

    private char detectDelimiter(String line) {
        if (line.contains(",")) return ',';
        if (line.contains(";")) return ';';
        if (line.contains("\t")) return '\t';
        return ',';
    }

    private String cleanHeader(String col) {
        return col != null ? col.trim().toLowerCase().replaceAll("[^a-z0-9]", "") : "";
    }

    private List<String> parseCsvLine(String line, char delimiter) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == delimiter && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens;
    }


    public void assignQuestion(String classroomId, String titleSlug, long startTimestamp, long endTimestamp) {
        assignQuestion(classroomId, Platform.LEETCODE, null, titleSlug, startTimestamp, endTimestamp);
    }

    public void assignQuestion(String classroomId, Platform platform, String title, String titleSlug, long startTimestamp, long endTimestamp) {
        log.info("Assigning question {} ({}) to classroom ID: {} with deadline from {} to {}",
                titleSlug, platform, classroomId, startTimestamp, endTimestamp);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        Assignment assignment = new Assignment();
        assignment.setId(UUID.randomUUID().toString());
        assignment.setPlatform(platform != null ? platform : Platform.LEETCODE);
        assignment.setTitle(title);
        assignment.setTitleSlug(titleSlug);
        assignment.setStartTimestamp(startTimestamp);
        assignment.setEndTimestamp(endTimestamp);
        enrichAssignmentDetails(assignment);

        initializeAssignmentsIfNull(classroom);
        classroom.getAssignments().add(assignment);

        classroomRepository.save(classroom);
        log.info("Successfully assigned {} to classroom {}", titleSlug, classroom.getClassName());
    }

    // NEW & ENHANCED: Get Classroom Analytics with Smart Weakness Engine & Risk Watchlist
    @Cacheable(value = "classroom-analytics", key = "#classroomId")
    public ClassroomAnalyticsDTO getClassroomAnalytics(String classroomId) {
        log.info("Generating Enhanced Analytics for Classroom ID: {}", classroomId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found"));

        List<Student> students = (classroom.getStudentIds() != null && !classroom.getStudentIds().isEmpty())
                ? studentRepository.findAllById(classroom.getStudentIds())
                : Collections.emptyList();
        int totalStudents = students.size();

        if (totalStudents == 0) {
            return ClassroomAnalyticsDTO.builder()
                    .classroomId(classroomId)
                    .className(classroom.getClassName())
                    .totalStudents(0)
                    .averageTotalSolved(0)
                    .averageEasy(0)
                    .averageMedium(0)
                    .averageHard(0)
                    .activeStudentsThisWeek(0)
                    .classEngagementScore(0.0)
                    .topStrengths(new ArrayList<>())
                    .criticalWeaknesses(new ArrayList<>())
                    .topicProficiencies(new ArrayList<>())
                    .recommendedActionItems(new ArrayList<>())
                    .atRiskStudentsCount(0)
                    .atRiskStudents(new ArrayList<>())
                    .averageStreak(0.0)
                    .streakChampion("N/A")
                    .streakChampionStreak(0)
                    .totalAssignments(0)
                    .assignmentCompletionRate(0.0)
                    .assignmentsBreakdown(new ArrayList<>())
                    .easyPercentage(0.0)
                    .mediumPercentage(0.0)
                    .hardPercentage(0.0)
                    .interviewReadinessScore(0)
                    .readinessAssessment("No students currently enrolled in this classroom.")
                    .dualPlatformStudents(0)
                    .leetcodeOnlyStudents(0)
                    .codeforcesOnlyStudents(0)
                    .averageLeetcodeRating(0.0)
                    .averageCodeforcesRating(0.0)
                    .build();
        }

        int totalSolved = 0, totalEasy = 0, totalMed = 0, totalHard = 0, activeCount = 0;
        int dualPlatformCount = 0, lcOnlyCount = 0, cfOnlyCount = 0;
        double totalLcRating = 0.0, totalCfRating = 0.0;
        int lcRatedCount = 0, cfRatedCount = 0;
        int totalStreak = 0, maxStreak = 0;
        String streakChampion = "N/A";

        Map<String, Integer> studentTotalSolvedMap = new HashMap<>();
        Map<String, Boolean> studentActiveMap = new HashMap<>();
        Map<String, Integer> aggregatedSkills = new HashMap<>();

        long oneWeekAgo = System.currentTimeMillis() / 1000 - (7 * 86400);

        for (Student s : students) {
            // 1. Calculate Difficulties and Total Solved across platforms
            int studentLcSolved = 0;
            int sEasy = 0, sMed = 0, sHard = 0;
            if (s.getProblemStats() != null) {
                for (var stat : s.getProblemStats()) {
                    if (stat.getDifficulty() == null) continue;
                    switch (stat.getDifficulty().toLowerCase()) {
                        case "all" -> studentLcSolved += stat.getCount();
                        case "easy" -> sEasy += stat.getCount();
                        case "medium" -> sMed += stat.getCount();
                        case "hard" -> sHard += stat.getCount();
                    }
                }
            }
            int studentCfSolved = s.getCodeforcesSolvedCount() != null ? s.getCodeforcesSolvedCount() : 0;
            int studentTotal = studentLcSolved + studentCfSolved;

            studentTotalSolvedMap.put(s.getId(), studentTotal);
            totalSolved += studentTotal;
            totalEasy += sEasy;
            totalMed += sMed;
            totalHard += sHard;

            // 2. Check Engagement (Active in last 7 days)
            boolean isActive = s.getRecentSubmissions() != null && s.getRecentSubmissions().stream()
                    .anyMatch(sub -> sub.getTimestamp() >= oneWeekAgo);
            studentActiveMap.put(s.getId(), isActive);
            if (isActive) activeCount++;

            // 3. Platform Distribution
            boolean hasLc = s.getLeetcodeUsername() != null && !s.getLeetcodeUsername().isBlank();
            boolean hasCf = s.getCodeforcesHandle() != null && !s.getCodeforcesHandle().isBlank();
            if (hasLc && hasCf) dualPlatformCount++;
            else if (hasLc) lcOnlyCount++;
            else if (hasCf) cfOnlyCount++;

            // 4. Contest Ratings
            if (s.getCurrentContestRating() > 0) {
                totalLcRating += s.getCurrentContestRating();
                lcRatedCount++;
            }
            if (s.getCodeforcesRating() != null && s.getCodeforcesRating() > 0) {
                totalCfRating += s.getCodeforcesRating();
                cfRatedCount++;
            }

            // 5. Consistency Streak
            int sStreak = studentMapper.calculateStreak(s.getProgressHistory());
            totalStreak += sStreak;
            if (sStreak > maxStreak) {
                maxStreak = sStreak;
                streakChampion = (s.getName() != null && !s.getName().isBlank()) ? s.getName() : s.getLeetcodeUsername();
            }

            // 6. Aggregate Skills
            if (s.getSkills() != null) {
                for (var skill : s.getSkills()) {
                    if (skill.getTagName() != null && !skill.getTagName().isBlank()) {
                        aggregatedSkills.merge(skill.getTagName(), skill.getProblemsSolved(), Integer::sum);
                    }
                }
            }
        }

        int avgSolved = totalSolved / totalStudents;
        int avgEasy = totalEasy / totalStudents;
        int avgMed = totalMed / totalStudents;
        int avgHard = totalHard / totalStudents;
        double avgStreak = (double) totalStreak / totalStudents;
        double avgLcRating = lcRatedCount > 0 ? (totalLcRating / lcRatedCount) : 0.0;
        double avgCfRating = cfRatedCount > 0 ? (totalCfRating / cfRatedCount) : 0.0;

        double easyPct = totalSolved > 0 ? (totalEasy * 100.0) / totalSolved : 0.0;
        double medPct = totalSolved > 0 ? (totalMed * 100.0) / totalSolved : 0.0;
        double hardPct = totalSolved > 0 ? (totalHard * 100.0) / totalSolved : 0.0;

        // 7. At-Risk Students Watchlist
        List<AtRiskStudentDTO> atRiskList = new ArrayList<>();
        for (Student s : students) {
            boolean isActive = studentActiveMap.getOrDefault(s.getId(), false);
            int sSolved = studentTotalSolvedMap.getOrDefault(s.getId(), 0);
            int sStreak = studentMapper.calculateStreak(s.getProgressHistory());

            String riskLevel = null;
            String riskReason = null;

            if (!isActive) {
                if (sSolved < (avgSolved * 0.5)) {
                    riskLevel = "HIGH";
                    riskReason = "Inactive in the last 7 days and solve count is below 50% of class average.";
                } else {
                    riskLevel = "MEDIUM";
                    riskReason = "No submissions recorded in the last 7 days.";
                }
            } else if (totalStudents > 1 && sSolved < (avgSolved * 0.35)) {
                riskLevel = "MEDIUM";
                riskReason = "Total problems solved is significantly below cohort pace.";
            }

            if (riskLevel != null) {
                atRiskList.add(AtRiskStudentDTO.builder()
                        .studentId(s.getId())
                        .name(s.getName() != null && !s.getName().isBlank() ? s.getName() : "Student")
                        .email(s.getEmail())
                        .leetcodeUsername(s.getLeetcodeUsername())
                        .codeforcesHandle(s.getCodeforcesHandle())
                        .totalSolved(sSolved)
                        .streak(sStreak)
                        .activeThisWeek(isActive)
                        .riskLevel(riskLevel)
                        .riskReason(riskReason)
                        .build());
            }
        }
        atRiskList.sort((a, b) -> {
            if ("HIGH".equals(a.getRiskLevel()) && !"HIGH".equals(b.getRiskLevel())) return -1;
            if (!"HIGH".equals(a.getRiskLevel()) && "HIGH".equals(b.getRiskLevel())) return 1;
            return Integer.compare(a.getTotalSolved(), b.getTotalSolved());
        });

        // 8. Assignments Completion Analytics
        List<Assignment> assignments = classroom.getAssignments() != null ? classroom.getAssignments() : Collections.emptyList();
        List<AssignmentAnalyticsDTO> assignmentsBreakdown = new ArrayList<>();
        double totalCompletionPercentSum = 0.0;

        for (Assignment a : assignments) {
            int completedCount = 0;
            for (Student s : students) {
                boolean isManually = s.getManuallyCompletedAssignments() != null &&
                        s.getManuallyCompletedAssignments().contains(a.getId());
                boolean isCaught = false;
                if (!isManually && s.getRecentSubmissions() != null) {
                    isCaught = s.getRecentSubmissions().stream()
                            .anyMatch(sub -> StudentMapper.isProblemSlugMatch(sub.getTitleSlug(), a.getTitleSlug()));
                }
                if (isManually || isCaught) {
                    completedCount++;
                }
            }

            double compPct = (completedCount * 100.0) / totalStudents;
            totalCompletionPercentSum += compPct;
            boolean isExpired = a.getEndTimestamp() > 0 && a.getEndTimestamp() < (System.currentTimeMillis() / 1000);

            assignmentsBreakdown.add(AssignmentAnalyticsDTO.builder()
                    .assignmentId(a.getId())
                    .title(a.getTitle() != null && !a.getTitle().isBlank() ? a.getTitle() : a.getTitleSlug())
                    .titleSlug(a.getTitleSlug())
                    .platform(a.getPlatform() != null ? a.getPlatform().name() : "LEETCODE")
                    .questionLink(a.getQuestionLink())
                    .completedStudentsCount(completedCount)
                    .totalStudentsCount(totalStudents)
                    .completionPercentage(compPct)
                    .startTimestamp(a.getStartTimestamp())
                    .endTimestamp(a.getEndTimestamp())
                    .expired(isExpired)
                    .build());
        }

        double classAssignmentCompRate = assignments.isEmpty() ? 100.0 : (totalCompletionPercentSum / assignments.size());

        // 9. Topic Analysis & Smart Weakness Engine
        List<String> coreCurriculumTopics = List.of(
                "Dynamic Programming", "Tree", "Graph", "Binary Search",
                "Two Pointers", "Sliding Window", "Stack", "Heap (Priority Queue)",
                "Backtracking", "Linked List", "Greedy", "Hash Table"
        );
        for (String coreTopic : coreCurriculumTopics) {
            aggregatedSkills.putIfAbsent(coreTopic, 0);
        }

        List<TopicProficiencyDTO> topicProficiencies = new ArrayList<>();
        List<CuratedProblemDTO> recommendedActionItems = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : aggregatedSkills.entrySet()) {
            String tagName = entry.getKey();
            int count = entry.getValue();
            double avgSolvedForTopic = (double) count / totalStudents;
            boolean isCore = curatedTopicCatalog != null && curatedTopicCatalog.isCoreInterviewTopic(tagName);

            String level;
            String severity;
            String recommendation;

            if (avgSolvedForTopic >= 12.0) {
                level = "STRONG";
                severity = "LOW";
                recommendation = "Cohort demonstrates high proficiency. Ready for hard-tier problem variants.";
            } else if (avgSolvedForTopic >= 4.0) {
                level = "DEVELOPING";
                severity = isCore ? "MEDIUM" : "LOW";
                recommendation = "Solid foundation developing. Reinforce with intermediate pattern practice.";
            } else {
                level = "CRITICAL_WEAKNESS";
                severity = isCore ? "HIGH" : "MEDIUM";
                recommendation = isCore
                        ? "High-priority interview topic with low practice! Schedule dedicated cohort assignment."
                        : "Low solve volume across students. Encourage practice to build breadth.";
            }

            List<CuratedProblemDTO> suggested = curatedTopicCatalog != null
                    ? curatedTopicCatalog.getCuratedProblemsForTopic(tagName)
                    : Collections.emptyList();

            topicProficiencies.add(TopicProficiencyDTO.builder()
                    .tagName(tagName)
                    .problemsSolved(count)
                    .averageSolved(avgSolvedForTopic)
                    .masteryLevel(level)
                    .severity(severity)
                    .recommendation(recommendation)
                    .suggestedProblems(suggested)
                    .build());
        }

        // Sort topic proficiencies: HIGH severity first, then by solve count
        topicProficiencies.sort((a, b) -> {
            int severityCompare = getSeverityOrder(a.getSeverity()) - getSeverityOrder(b.getSeverity());
            if (severityCompare != 0) return severityCompare;
            return Integer.compare(a.getProblemsSolved(), b.getProblemsSolved());
        });

        // Collect top action items (suggested problems from the most critical weaknesses)
        for (TopicProficiencyDTO tp : topicProficiencies) {
            if ("HIGH".equals(tp.getSeverity()) && tp.getSuggestedProblems() != null) {
                for (CuratedProblemDTO p : tp.getSuggestedProblems()) {
                    if (recommendedActionItems.size() < 4 && !recommendedActionItems.contains(p)) {
                        recommendedActionItems.add(p);
                    }
                }
            }
        }

        // Legacy topStrengths & criticalWeaknesses for backwards compatibility
        List<SkillStat> sortedSkillsDesc = aggregatedSkills.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .map(e -> new SkillStat(e.getKey(), e.getValue()))
                .sorted((a, b) -> Integer.compare(b.getProblemsSolved(), a.getProblemsSolved()))
                .toList();

        List<SkillStat> topStrengths = sortedSkillsDesc.stream().limit(5).toList();

        List<SkillStat> criticalWeaknesses = topicProficiencies.stream()
                .filter(tp -> "CRITICAL_WEAKNESS".equals(tp.getMasteryLevel()))
                .limit(5)
                .map(tp -> new SkillStat(tp.getTagName(), tp.getProblemsSolved()))
                .toList();

        // 10. Interview Readiness Score (0-100)
        double difficultyScore = Math.min(35.0, ((medPct * 0.7 + hardPct * 1.5) / 50.0) * 35.0);
        double engagementScore = ((double) activeCount / totalStudents) * 30.0;
        long coreMastered = topicProficiencies.stream()
                .filter(tp -> ("STRONG".equals(tp.getMasteryLevel()) || "DEVELOPING".equals(tp.getMasteryLevel()))
                        && curatedTopicCatalog != null && curatedTopicCatalog.isCoreInterviewTopic(tp.getTagName()))
                .count();
        double breadthScore = Math.min(20.0, (coreMastered / 8.0) * 20.0);
        double assignmentScore = (classAssignmentCompRate / 100.0) * 15.0;

        int readinessScore = (int) Math.round(Math.min(100.0, Math.max(0.0, difficultyScore + engagementScore + breadthScore + assignmentScore)));

        String readinessAssessment;
        if (readinessScore >= 75) {
            readinessAssessment = "Interview Ready — High algorithmic depth, balanced difficulty, and strong cohort consistency.";
        } else if (readinessScore >= 50) {
            readinessAssessment = "Solid Foundation — Good problem-solving momentum; assign more Medium & Hard problems to build interview depth.";
        } else {
            readinessAssessment = "Foundational Phase — Focus on regular weekly consistency, assignment completion, and core DSA topics.";
        }

        return ClassroomAnalyticsDTO.builder()
                .classroomId(classroomId)
                .className(classroom.getClassName())
                .totalStudents(totalStudents)
                .averageTotalSolved(avgSolved)
                .averageEasy(avgEasy)
                .averageMedium(avgMed)
                .averageHard(avgHard)
                .activeStudentsThisWeek(activeCount)
                .classEngagementScore((activeCount * 100.0) / totalStudents)
                .topStrengths(topStrengths)
                .criticalWeaknesses(criticalWeaknesses)
                .topicProficiencies(topicProficiencies)
                .recommendedActionItems(recommendedActionItems)
                .atRiskStudentsCount(atRiskList.size())
                .atRiskStudents(atRiskList)
                .averageStreak(Math.round(avgStreak * 10.0) / 10.0)
                .streakChampion(streakChampion)
                .streakChampionStreak(maxStreak)
                .totalAssignments(assignments.size())
                .assignmentCompletionRate(Math.round(classAssignmentCompRate * 10.0) / 10.0)
                .assignmentsBreakdown(assignmentsBreakdown)
                .easyPercentage(Math.round(easyPct * 10.0) / 10.0)
                .mediumPercentage(Math.round(medPct * 10.0) / 10.0)
                .hardPercentage(Math.round(hardPct * 10.0) / 10.0)
                .interviewReadinessScore(readinessScore)
                .readinessAssessment(readinessAssessment)
                .dualPlatformStudents(dualPlatformCount)
                .leetcodeOnlyStudents(lcOnlyCount)
                .codeforcesOnlyStudents(cfOnlyCount)
                .averageLeetcodeRating(Math.round(avgLcRating * 10.0) / 10.0)
                .averageCodeforcesRating(Math.round(avgCfRating * 10.0) / 10.0)
                .build();
    }

    private int getSeverityOrder(String severity) {
        if ("HIGH".equalsIgnoreCase(severity)) return 1;
        if ("MEDIUM".equalsIgnoreCase(severity)) return 2;
        return 3;
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics", "mentors-all", "mentor"}, allEntries = true)
    public void deleteClassroom(String classroomId, String mentorId) {
        log.info("Attempting to delete classroom ID: {} by mentor ID: {}", classroomId, mentorId);

        // 1. Find the classroom
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        // 2. Security Check: Ensure the mentor deleting it actually owns it
        if (!classroom.getMentorId().equals(mentorId)) {
            log.warn("Security Alert: Mentor {} attempted to delete classroom {} which they do not own.", mentorId, classroomId);
            throw new AccessDeniedException("You do not have permission to delete this classroom.");
        }

        // 3. Remove the classroom ID from the mentor's profile
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));

        mentor.getClassroomIds().remove(classroomId);
        mentorRepository.save(mentor);

        // 4. Delete the actual classroom document
        classroomRepository.delete(classroom);

        // 5. Clean up Redis leaderboards for this classroom
        redisLeaderboardService.deleteClassroomLeaderboards(classroomId);
        log.info("Successfully deleted classroom ID: {}", classroomId);
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public void deleteAssignment(String classroomId, String assignmentId, String mentorId) {
        log.info("Deleting assignment {} from classroom {} by mentor {}", assignmentId, classroomId, mentorId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        if (!classroom.getMentorId().equals(mentorId)) {
            log.warn("Security Alert: Mentor {} attempted to delete assignment {} in classroom {} which they do not own.", mentorId, assignmentId, classroomId);
            throw new AccessDeniedException("You do not have permission to delete assignments in this classroom.");
        }

        if (classroom.getAssignments() != null) {
            boolean removed = classroom.getAssignments().removeIf(a -> a.getId().equals(assignmentId));
            if (!removed) {
                throw new AssignmentNotFoundException("Assignment not found with ID: " + assignmentId);
            }
            classroomRepository.save(classroom);
        } else {
            throw new AssignmentNotFoundException("Assignment not found with ID: " + assignmentId);
        }

        // Broadcast the update via local messagingTemplate and Redis Pub/Sub WebSocket bridge
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Assignment deleted!")
        );
        webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "Assignment deleted!");
        log.info("Successfully deleted assignment {} from classroom {}", assignmentId, classroomId);
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Classroom updateAssignmentDeadline(String classroomId, String assignmentId, String mentorId, long newEndTimestamp) {
        log.info("Updating deadline for assignment {} in classroom {} to {} by mentor {}",
                assignmentId, classroomId, newEndTimestamp, mentorId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        if (!classroom.getMentorId().equals(mentorId)) {
            log.warn("Security Alert: Mentor {} attempted to update assignment {} in classroom {} which they do not own.",
                    mentorId, assignmentId, classroomId);
            throw new AccessDeniedException("You do not have permission to modify assignments in this classroom.");
        }

        if (newEndTimestamp <= 0) {
            throw new ValidationFailedException("Invalid deadline timestamp. Deadline must be a positive timestamp.");
        }

        if (classroom.getAssignments() == null || classroom.getAssignments().isEmpty()) {
            throw new AssignmentNotFoundException("No assignments found in this classroom.");
        }

        Assignment targetAssignment = classroom.getAssignments().stream()
                .filter(a -> a.getId().equals(assignmentId))
                .findFirst()
                .orElseThrow(() -> new AssignmentNotFoundException("Assignment not found with ID: " + assignmentId));

        targetAssignment.setEndTimestamp(newEndTimestamp);
        Classroom saved = classroomRepository.save(classroom);

        // Broadcast the update via local messagingTemplate and Redis Pub/Sub WebSocket bridge
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Assignment deadline updated!")
        );
        webSocketBridge.broadcastClassroomUpdate(classroomId, "UPDATE", "Assignment deadline updated!");

        log.info("Successfully updated deadline for assignment {} to {}", assignmentId, newEndTimestamp);
        return saved;
    }

    public List<com.tracker.leetcode.tracker.DTO.LeaderboardEntryDTO> getRedisLeaderboard(String classroomId, String metric, int limit) {
        return redisLeaderboardService.getLeaderboard(classroomId, metric, limit);
    }

    private void updateStudentInRedisLeaderboards(Student student, String classroomId) {
        if (student == null) return;
        List<String> cids = (classroomId != null) ? List.of(classroomId) : Collections.emptyList();
        updateStudentInRedisLeaderboards(student, cids);
    }

    private void updateStudentInRedisLeaderboards(Student student, List<String> classroomIds) {
        if (student == null || student.getId() == null) return;
        try {
            int lcSolved = student.getProblemStats() != null ? studentMapper.calculateLeetcodeSolved(student.getProblemStats()) : 0;
            int cfSolved = student.getCodeforcesSolvedCount() != null ? student.getCodeforcesSolvedCount() : 0;
            int solved = lcSolved + cfSolved;
            double rating = Math.max(
                    student.getCurrentContestRating(),
                    student.getCodeforcesRating() != null ? student.getCodeforcesRating() : 0.0
            );
            int streak = student.getProgressHistory() != null ? studentMapper.calculateStreak(student.getProgressHistory()) : 0;

            redisLeaderboardService.updateStudentMetrics(
                    student.getId(),
                    student.getName(),
                    student.getLeetcodeUsername(),
                    student.getCodeforcesHandle(),
                    student.getAvatarUrl(),
                    solved,
                    rating,
                    streak,
                    classroomIds
            );
        } catch (Exception ex) {
            log.warn("Failed updating student in Redis leaderboards: {}", ex.getMessage());
        }
    }

    private int parseNumericalRank(String rankStr) {
        if (rankStr == null || rankStr.isBlank()) {
            return Integer.MAX_VALUE;
        }
        try {
            String digits = rankStr.replaceAll("[^0-9]", "");
            return digits.isEmpty() ? Integer.MAX_VALUE : Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }
}