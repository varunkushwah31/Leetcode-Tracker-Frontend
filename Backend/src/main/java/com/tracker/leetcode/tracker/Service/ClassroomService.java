package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.ClassroomAnalyticsDTO;
import com.tracker.leetcode.tracker.DTO.ClassroomDashboardDTO;
import com.tracker.leetcode.tracker.DTO.StudentSummaryDTO;
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

    @Lazy
    @Autowired
    private ClassroomService self;

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

    // 2. Add Student
    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics"}, allEntries = true)
    public Classroom addStudentToClassroom(String classroomId, String identifier) {
        log.info("Adding student {} to classroom ID: {}", identifier, classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        String trimmed = identifier != null ? identifier.trim() : "";
        Student student = studentRepository.findById(trimmed)
                .or(() -> studentRepository.findByEmail(trimmed))
                .or(() -> studentRepository.findByLeetcodeUsername(trimmed))
                .or(() -> studentRepository.findByCodeforcesHandle(trimmed))
                .orElseThrow(() -> new StudentNotFoundException("Student not found with identifier: " + trimmed));

        // Prevent duplicate enrollments in the same class
        if (classroom.getStudentIds().contains(student.getId())) {
            throw new StudentAlreadyEnrolledException("Student is already enrolled in this classroom.");
        }

        classroom.getStudentIds().add(student.getId());
        return classroomRepository.save(classroom);
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

        // 2. Map to DTOs and pass the classroom assignments for evaluation
        List<StudentSummaryDTO> studentSummaries = enrolledStudents.stream()
                .map(student -> studentMapper.toSummaryDTO(student, classroom.getAssignments()))
                .collect(Collectors.toList());

        // 3. Apply Dynamic Sorting
        if (sortBy != null && !sortBy.isBlank()) {
            switch (sortBy.toLowerCase()) {
                case "consistency":
                    studentSummaries.sort((s1, s2) -> Integer.compare(s2.getConsistencyStreak(), s1.getConsistencyStreak()));
                    break;
                case "rating":
                    studentSummaries.sort((s1, s2) -> Double.compare(s2.getCurrentContestRating(), s1.getCurrentContestRating()));
                    break;
                case "solved":
                    studentSummaries.sort((s1, s2) -> Integer.compare(s2.getTotalSolved(), s1.getTotalSolved()));
                    break;
                case "pending": // Sort by students who are falling behind!
                    studentSummaries.sort((s1, s2) -> Integer.compare(s2.getPendingAssignments(), s1.getPendingAssignments()));
                    break;
                case "completed": // Sort by students who finished the most assignments!
                    studentSummaries.sort((s1, s2) -> Integer.compare(s2.getCompletedAssignments(), s1.getCompletedAssignments()));
                    break;
                case "name":
                    studentSummaries.sort((s1, s2) -> s1.getName().compareToIgnoreCase(s2.getName()));
                    break;
                default:
                    log.warn("Unknown sort parameter: {}. Defaulting to unsorted.", sortBy);
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
                        assignment.getTitle().equalsIgnoreCase(assignment.getTitleSlug())) {
                    try {
                        CodeforcesApiClient.CodeforcesProblemInfo cfInfo = codeforcesApiClient.fetchProblemDetails(contestId, index);
                        if (cfInfo != null && cfInfo.title() != null && !cfInfo.title().isBlank()) {
                            assignment.setTitle(cfInfo.title());
                        } else {
                            assignment.setTitle("Problem " + contestId + index);
                        }
                    } catch (Exception e) {
                        assignment.setTitle("Problem " + contestId + index);
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
                                assignment.getTitle().equalsIgnoreCase(slug)) {
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
        for (String part : parts) {
            if (!part.isEmpty()) {
                sb.append(Character.toUpperCase(part.charAt(0)))
                  .append(part.substring(1).toLowerCase())
                  .append(" ");
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

    public Student validateManualSubmission(String classroomId, String studentIdentifier, String assignmentId, String submissionUrl) {
        log.info("Validating manual submission for {} on assignment {}", studentIdentifier, assignmentId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found"));

        Assignment assignment = classroom.getAssignments().stream()
                .filter(a -> a.getId().equals(assignmentId))
                .findFirst()
                .orElseThrow(() -> new AssignmentNotFoundException("Assignment not found in this classroom."));

        String trimmed = studentIdentifier != null ? studentIdentifier.trim() : "";
        Student student = studentRepository.findById(trimmed)
                .or(() -> studentRepository.findByEmail(trimmed))
                .or(() -> studentRepository.findByLeetcodeUsername(trimmed))
                .or(() -> studentRepository.findByCodeforcesHandle(trimmed))
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

        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Leaderboard changed!")
        );

        return savedStudent;
    }

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

        // Broadcast the update to anyone listening to this classroom
        log.info("Broadcasting leaderboard update for classroom: {}", classroomId);
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Leaderboard changed!")
        );

        return savedStudent;
    }

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
                studentRepository.save(student);
                if (messagingTemplate != null) {
                    for (Classroom classroom : classrooms) {
                        messagingTemplate.convertAndSend("/topic/classrooms/" + classroom.getId(),
                                (Object) Map.of("action", "UPDATE", "message", "Assignment auto-validated!"));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error during auto-validation of pending assignments for student {}: {}", student.getId(), e.getMessage());
        }
    }


    // 1. BULK IMPORT: Read CSV and add students
    public List<String> bulkAddStudents(String classroomId, MultipartFile file) {
        List<String> failedUsernames = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String studentIdentifier;
            // Read the CSV line by line
            while ((studentIdentifier = reader.readLine()) != null) {
                studentIdentifier = studentIdentifier.trim();
                // Skip empty lines or CSV header if it exists
                if (studentIdentifier.isEmpty()
                        || studentIdentifier.equalsIgnoreCase("username")
                        || studentIdentifier.equalsIgnoreCase("leetcode_username")
                        || studentIdentifier.equalsIgnoreCase("codeforces_handle")
                        || studentIdentifier.equalsIgnoreCase("handle")
                        || studentIdentifier.equalsIgnoreCase("identifier")) {
                    continue;
                }

                try {
                    addStudentToClassroom(classroomId, studentIdentifier);
                } catch (Exception e) {
                    log.warn("Failed to bulk add student: {}", studentIdentifier);
                    failedUsernames.add(studentIdentifier); // Track failures
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse uploaded CSV file for classroom [{}]: {}", classroomId, e.getMessage());
            throw new ValidationFailedException("Failed to parse CSV file: " + e.getMessage());
        }

        return failedUsernames;
    }

    // 2. EXPORT: Generate CSV string of the leaderboard
    //
    public String generateClassroomCsv(String classroomId) {
        // Reuse your existing dashboard logic to get sorted, fully-calculated stats!
        ClassroomDashboardDTO dashboard = self.getClassroomDashboard(classroomId, "solved");

        StringBuilder csv = new StringBuilder();
        // Add the standard CSV Header row
        csv.append("Rank,Name,LeetCode Username,Codeforces Handle,Daily Streak,Total Solved,LC Solved,CF Solved,LC Rating,CF Rating,Done Assignments,Pending Assignments\n");

        int rank = 1;
        for (StudentSummaryDTO s : dashboard.getEnrolledStudents()) {
            csv.append(rank++).append(",")
                    .append("\"").append(s.getName() != null ? s.getName().replace("\"", "\"\"") : "").append("\",")
                    .append(s.getLeetcodeUsername() != null ? s.getLeetcodeUsername() : "").append(",")
                    .append(s.getCodeforcesHandle() != null ? s.getCodeforcesHandle() : "").append(",")
                    .append(s.getConsistencyStreak()).append(",")
                    .append(s.getTotalSolved()).append(",")
                    .append(s.getLeetcodeSolvedCount()).append(",")
                    .append(s.getCodeforcesSolvedCount()).append(",")
                    .append(Math.round(s.getCurrentContestRating())).append(",")
                    .append(s.getCodeforcesRating() != null ? s.getCodeforcesRating() : 0).append(",")
                    .append(s.getCompletedAssignments()).append(",")
                    .append(s.getPendingAssignments()).append("\n");
        }
        return csv.toString();
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

    // NEW: Get Classroom Analytics
    @Cacheable(value = "classroom-analytics", key = "#classroomId")
    public ClassroomAnalyticsDTO getClassroomAnalytics(String classroomId) {
        log.info("Generating Analytics for Classroom ID: {}", classroomId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found"));

        List<Student> students = studentRepository.findAllById(classroom.getStudentIds());
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
                    .build();
        }

        int totalSolved = 0, totalEasy = 0, totalMed = 0, totalHard = 0, activeCount = 0;
        java.util.Map<String, Integer> aggregatedSkills = new java.util.HashMap<>();

        long oneWeekAgo = System.currentTimeMillis() / 1000 - (7 * 86400);

        for (Student s : students) {
            // 1. Calculate Difficulties and Total Solved across platforms
            int studentLcSolved = 0;
            if (s.getProblemStats() != null) {
                for (var stat : s.getProblemStats()) {
                    switch (stat.getDifficulty().toLowerCase()) {
                        case "all" -> studentLcSolved += stat.getCount();
                        case "easy" -> totalEasy += stat.getCount();
                        case "medium" -> totalMed += stat.getCount();
                        case "hard" -> totalHard += stat.getCount();
                    }
                }
            }
            int studentCfSolved = s.getCodeforcesSolvedCount() != null ? s.getCodeforcesSolvedCount() : 0;
            totalSolved += (studentLcSolved + studentCfSolved);

            // 2. Check Engagement (Active in last 7 days)
            boolean isActive = s.getRecentSubmissions() != null && s.getRecentSubmissions().stream()
                    .anyMatch(sub -> sub.getTimestamp() >= oneWeekAgo);
            if (isActive) activeCount++;

            // 3. Aggregate Skills
            if (s.getSkills() != null) {
                for (var skill : s.getSkills()) {
                    aggregatedSkills.merge(skill.getTagName(), skill.getProblemsSolved(), Integer::sum);
                }
            }
        }

        // Sort skills by total solved across the class
        List<SkillStat> sortedSkills = aggregatedSkills.entrySet().stream()
                .map(e -> new SkillStat(e.getKey(), e.getValue()))
                .sorted((a, b) -> Integer.compare(b.getProblemsSolved(), a.getProblemsSolved()))
                .toList();

        // Top 5 Strengths
        List<SkillStat> topStrengths = sortedSkills.stream().limit(5).toList();

        // Top 5 Weaknesses (Topics they have barely touched, but at least 1 person tried)
        List<SkillStat> criticalWeaknesses = sortedSkills.stream()
                .filter(s -> s.getProblemsSolved() > 0) // Ignore completely untouched
                .skip(Math.max(0, sortedSkills.size() - 5)) // Get the bottom 5
                .sorted(Comparator.comparingInt(SkillStat::getProblemsSolved)) // Sort ascending for weaknesses
                .toList();

        return ClassroomAnalyticsDTO.builder()
                .classroomId(classroomId)
                .className(classroom.getClassName())
                .totalStudents(totalStudents)
                .averageTotalSolved(totalSolved / totalStudents)
                .averageEasy(totalEasy / totalStudents)
                .averageMedium(totalMed / totalStudents)
                .averageHard(totalHard / totalStudents)
                .activeStudentsThisWeek(activeCount)
                .classEngagementScore((activeCount * 100.0) / totalStudents)
                .topStrengths(topStrengths)
                .criticalWeaknesses(criticalWeaknesses)
                .build();
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

        // Broadcast the update via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Assignment deleted!")
        );
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

        // Broadcast the update via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/classrooms/" + classroomId,
                (Object) Map.of("action", "UPDATE", "message", "Assignment deadline updated!")
        );

        log.info("Successfully updated deadline for assignment {} to {}", assignmentId, newEndTimestamp);
        return saved;
    }
}