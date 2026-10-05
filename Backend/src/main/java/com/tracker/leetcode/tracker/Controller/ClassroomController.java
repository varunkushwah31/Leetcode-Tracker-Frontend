package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.BulkImportResponseDTO;
import com.tracker.leetcode.tracker.DTO.ClassroomAnalyticsDTO;
import com.tracker.leetcode.tracker.DTO.ClassroomDashboardDTO;
import com.tracker.leetcode.tracker.DTO.SubmissionUrlRequest;
import com.tracker.leetcode.tracker.Models.Assignment;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Service.ClassroomService;
import com.tracker.leetcode.tracker.Service.EmailService;
import com.tracker.leetcode.tracker.Exception.ClassroomNotFoundException;
import com.tracker.leetcode.tracker.Exception.StudentNotFoundException;
import com.tracker.leetcode.tracker.Exception.ValidationFailedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

@Slf4j
@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;
    private final ClassroomRepository classroomRepository;
    private final StudentRepository studentRepository;
    private final EmailService emailService;

    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> parseJsonBody(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) return null;
        String contentType = request.getContentType();
        if (contentType == null || !contentType.toLowerCase().contains("application/json")) {
            return null;
        }
        try {
            tools.jackson.databind.ObjectMapper mapper = new tools.jackson.databind.ObjectMapper();
            return mapper.readValue(request.getInputStream(), java.util.Map.class);
        } catch (Exception e) {
            log.debug("Could not parse request body as JSON: {}", e.getMessage());
            return null;
        }
    }

    // 1. Create a Classroom (supports JSON body, form urlencoded, and query params)
    @PostMapping
    public ResponseEntity<Classroom> createClassroom(
            @RequestParam(required = false) String mentorId,
            @RequestParam(required = false) String className,
            jakarta.servlet.http.HttpServletRequest request) {

        String effectiveMentorId = mentorId;
        String effectiveClassName = className;

        java.util.Map<String, Object> body = parseJsonBody(request);
        if (body != null) {
            if (effectiveMentorId == null && body.containsKey("mentorId")) effectiveMentorId = String.valueOf(body.get("mentorId"));
            if (effectiveClassName == null && body.containsKey("className")) effectiveClassName = String.valueOf(body.get("className"));
        }

        if (effectiveMentorId == null || effectiveMentorId.isBlank()) {
            throw new ValidationFailedException("mentorId is required to create classroom.");
        }
        if (effectiveClassName == null || effectiveClassName.isBlank()) {
            throw new ValidationFailedException("className is required to create classroom.");
        }
        return ResponseEntity.ok(classroomService.createClassroom(effectiveMentorId, effectiveClassName));
    }

    // 2. Add Student to Classroom (supports JSON body, form urlencoded, and query params)
    @PostMapping("/{classroomId}/students")
    public ResponseEntity<Classroom> addStudentToClassroom(
            @PathVariable String classroomId,
            @RequestParam(required = false) String leetcodeUsername,
            @RequestParam(required = false) String identifier,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String mentorId,
            jakarta.servlet.http.HttpServletRequest request) {

        String effectiveIdentifier = identifier != null ? identifier
                : leetcodeUsername != null ? leetcodeUsername
                : studentId;

        String effectiveMentorId = mentorId;

        java.util.Map<String, Object> body = parseJsonBody(request);
        if (body != null) {
            if (effectiveIdentifier == null || effectiveIdentifier.isBlank()) {
                if (body.containsKey("identifier")) effectiveIdentifier = String.valueOf(body.get("identifier"));
                else if (body.containsKey("leetcodeUsername")) effectiveIdentifier = String.valueOf(body.get("leetcodeUsername"));
                else if (body.containsKey("studentId")) effectiveIdentifier = String.valueOf(body.get("studentId"));
                else if (body.containsKey("username")) effectiveIdentifier = String.valueOf(body.get("username"));
            }
            if (effectiveMentorId == null && body.containsKey("mentorId")) {
                effectiveMentorId = String.valueOf(body.get("mentorId"));
            }
        }

        if (effectiveIdentifier == null || effectiveIdentifier.isBlank()) {
            throw new ValidationFailedException("Student identifier, username, or profile URL is required.");
        }

        return ResponseEntity.ok(classroomService.addStudentToClassroom(classroomId, effectiveIdentifier, effectiveMentorId));
    }

    // 2b. Remove Student from Classroom
    @DeleteMapping("/{classroomId}/students/{studentId}")
    public ResponseEntity<Classroom> removeStudentFromClassroom(
            @PathVariable String classroomId,
            @PathVariable String studentId,
            @RequestParam(required = false) String mentorId) {

        return ResponseEntity.ok(classroomService.removeStudentFromClassroom(classroomId, studentId, mentorId));
    }

    @DeleteMapping("/{classroomId}/students")
    public ResponseEntity<Classroom> removeStudentFromClassroomQuery(
            @PathVariable String classroomId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String identifier,
            @RequestParam(required = false) String leetcodeUsername,
            @RequestParam(required = false) String mentorId) {

        String effectiveId = studentId != null ? studentId : identifier != null ? identifier : leetcodeUsername;
        if (effectiveId == null || effectiveId.isBlank()) {
            throw new ValidationFailedException("Student identifier is required to remove student.");
        }
        return ResponseEntity.ok(classroomService.removeStudentFromClassroom(classroomId, effectiveId, mentorId));
    }

    // 3. Get the Classroom Dashboard (With Sorting)
    // URL Examples:
    // GET /api/classrooms/{id}/dashboard
    // GET /api/classrooms/{id}/dashboard?sortBy=consistency
    // GET /api/classrooms/{id}/dashboard?sortBy=rating
    // GET /api/classrooms/{id}/dashboard?sortBy=solved
    @GetMapping("/{classroomId}/dashboard")
    public ResponseEntity<ClassroomDashboardDTO> getClassroomDashboard(
            @PathVariable String classroomId,
            @RequestParam(required = false, defaultValue = "name") String sortBy) {

        return ResponseEntity.ok(classroomService.getClassroomDashboard(classroomId, sortBy));
    }

    // 4. Assign a Question to the Classroom
    // URL: POST /api/classrooms/{id}/assignments
    /* Body Example:
       {
           "titleSlug": "two-sum",
           "startTimestamp": 1711000000,
           "endTimestamp": 1711604800
       }
    */
    @PostMapping("/{classroomId}/assignments")
    public ResponseEntity<Classroom> assignQuestion(
            @PathVariable String classroomId,
            @RequestBody Assignment assignment) {
        return ResponseEntity.ok(classroomService.assignQuestionToClassroom(classroomId, assignment));
    }

    // 5. Manually Validate Assignment URL
    // URL: POST /api/classrooms/{classroomId}/students/{username}/assignments/{assignmentId}/validate
    /* Body: { "url": "https://leetcode.com/problems/two-sum/submissions/123456789/" } */
    @PostMapping("/{classroomId}/students/{username}/assignments/{assignmentId}/validate")
    public ResponseEntity<Student> validateSubmission(
            @PathVariable String classroomId,
            @PathVariable String username,
            @PathVariable String assignmentId,
            @RequestBody SubmissionUrlRequest request) {

        return ResponseEntity.ok(classroomService.validateManualSubmission(classroomId, username, assignmentId, request.getUrl()));
    }

    // Autowire EmailService and StudentRepository at the top of your controller
    @PostMapping("/{classroomId}/students/{studentId}/nudge")
    public ResponseEntity<?> nudgeStudent(
            @PathVariable String classroomId,
            @PathVariable String studentId,
            @RequestParam String assignmentName) {

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found with ID: " + studentId));

        if (student.getEmail() == null || student.getEmail().isBlank()) {
            throw new ValidationFailedException("Student '" + student.getName() + "' does not have a valid email address.");
        }

        emailService.sendNudgeEmail(student.getEmail(), student.getName(), assignmentName, classroom.getClassName());
        log.info("Sent nudge email to student [{}] for assignment [{}]", student.getEmail(), assignmentName);
        return ResponseEntity.ok().build();
    }

    // 1. Endpoint for Bulk Import (Receives a file)
    @PostMapping("/{classroomId}/students/bulk")
    public ResponseEntity<BulkImportResponseDTO> bulkAddStudents(
            @PathVariable String classroomId,
            @RequestParam("file") MultipartFile file) {

        BulkImportResponseDTO result = classroomService.bulkAddStudents(classroomId, file);
        return ResponseEntity.ok(result);
    }

    // 1b. Download Sample CSV Template
    @GetMapping(value = "/template/csv", produces = "text/csv")
    public ResponseEntity<byte[]> downloadStudentTemplate() {
        String csvData = classroomService.generateStudentTemplateCsv();
        byte[] output = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"student_import_template.csv\"");
        return new ResponseEntity<>(output, headers, HttpStatus.OK);
    }

    // 2. Endpoint for CSV Export (Leaderboard)
    @GetMapping(value = "/{classroomId}/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportClassroom(@PathVariable String classroomId) {
        String csvData = classroomService.generateClassroomCsv(classroomId);
        byte[] output = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"leaderboard_" + classroomId + ".csv\"");
        return new ResponseEntity<>(output, headers, HttpStatus.OK);
    }

    // 2b. Endpoint for Assignment Matrix CSV Export
    @GetMapping(value = "/{classroomId}/export/assignments", produces = "text/csv")
    public ResponseEntity<byte[]> exportClassroomAssignments(@PathVariable String classroomId) {
        String csvData = classroomService.generateClassroomAssignmentMatrixCsv(classroomId);
        byte[] output = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"assignments_matrix_" + classroomId + ".csv\"");
        return new ResponseEntity<>(output, headers, HttpStatus.OK);
    }


    @GetMapping("/{classroomId}/analytics")
    public ResponseEntity<ClassroomAnalyticsDTO> getClassroomAnalytics(@PathVariable String classroomId) {
        return ResponseEntity.ok(classroomService.getClassroomAnalytics(classroomId));
    }

    // Add this method inside your ClassroomController class
    @DeleteMapping("/{classroomId}")
    public ResponseEntity<String> deleteClassroom(
            @PathVariable String classroomId,
            @RequestParam String mentorId) {

        classroomService.deleteClassroom(classroomId, mentorId);
        return ResponseEntity.ok("Classroom deleted successfully.");
    }

    @DeleteMapping("/{classroomId}/assignments/{assignmentId}")
    public ResponseEntity<String> deleteAssignment(
            @PathVariable String classroomId,
            @PathVariable String assignmentId,
            @RequestParam String mentorId) {

        classroomService.deleteAssignment(classroomId, assignmentId, mentorId);
        return ResponseEntity.ok("Assignment deleted successfully.");
    }

    @PutMapping("/{classroomId}/assignments/{assignmentId}/deadline")
    public ResponseEntity<Classroom> updateAssignmentDeadline(
            @PathVariable String classroomId,
            @PathVariable String assignmentId,
            @RequestParam(required = false) String mentorId,
            @RequestParam(required = false) Long newEndTimestamp,
            jakarta.servlet.http.HttpServletRequest request) {

        String effectiveMentorId = mentorId;
        Long effectiveDeadline = newEndTimestamp;

        java.util.Map<String, Object> body = parseJsonBody(request);
        if (body != null) {
            if (effectiveMentorId == null && body.containsKey("mentorId")) {
                effectiveMentorId = String.valueOf(body.get("mentorId"));
            }
            if (effectiveDeadline == null && (body.containsKey("newEndTimestamp") || body.containsKey("endTimestamp"))) {
                Object rawTs = body.getOrDefault("newEndTimestamp", body.get("endTimestamp"));
                if (rawTs instanceof Number num) {
                    effectiveDeadline = num.longValue();
                } else if (rawTs != null) {
                    effectiveDeadline = Long.parseLong(String.valueOf(rawTs));
                }
            }
        }

        if (effectiveMentorId == null || effectiveMentorId.isBlank()) {
            throw new ValidationFailedException("mentorId is required to update assignment deadline.");
        }
        if (effectiveDeadline == null || effectiveDeadline <= 0) {
            throw new ValidationFailedException("Valid newEndTimestamp is required.");
        }

        Classroom updated = classroomService.updateAssignmentDeadline(classroomId, assignmentId, effectiveMentorId, effectiveDeadline);
        return ResponseEntity.ok(updated);
    }

    // 10. Redis Real-time Classroom Leaderboard
    @GetMapping("/{classroomId}/leaderboard")
    public ResponseEntity<List<com.tracker.leetcode.tracker.DTO.LeaderboardEntryDTO>> getClassroomLeaderboard(
            @PathVariable String classroomId,
            @RequestParam(defaultValue = "solved") String metric,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(classroomService.getRedisLeaderboard(classroomId, metric, limit));
    }

    // 11. Redis Real-time Global Leaderboard
    @GetMapping("/leaderboard")
    public ResponseEntity<List<com.tracker.leetcode.tracker.DTO.LeaderboardEntryDTO>> getGlobalLeaderboard(
            @RequestParam(defaultValue = "solved") String metric,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(classroomService.getRedisLeaderboard(null, metric, limit));
    }
}