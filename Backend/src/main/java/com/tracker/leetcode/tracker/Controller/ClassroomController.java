package com.tracker.leetcode.tracker.Controller;

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

    // 1. Create a Classroom
    // URL Example: POST /api/classrooms?mentorId=65f1a2b...&className=Data%20Structures
    @PostMapping
    public ResponseEntity<Classroom> createClassroom(
            @RequestParam String mentorId,
            @RequestParam String className) {
        return ResponseEntity.ok(classroomService.createClassroom(mentorId, className));
    }

    @PostMapping("/{classroomId}/students") // Removed the variable from path
    public ResponseEntity<Classroom> addStudentToClassroom(
            @PathVariable String classroomId,
            @RequestParam String leetcodeUsername) { // Changed to @RequestParam
        return ResponseEntity.ok(classroomService.addStudentToClassroom(classroomId, leetcodeUsername));
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
    public ResponseEntity<List<String>> bulkAddStudents(
            @PathVariable String classroomId,
            @RequestParam("file") MultipartFile file) {

        List<String> failedAdds = classroomService.bulkAddStudents(classroomId, file);
        return ResponseEntity.ok(failedAdds);
    }

    // 2. Endpoint for CSV Export (Returns a downloadable file)
    @GetMapping(value = "/{classroomId}/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportClassroom(@PathVariable String classroomId) {
        String csvData = classroomService.generateClassroomCsv(classroomId);
        byte[] output = csvData.getBytes();

        HttpHeaders headers = new HttpHeaders();
        // This header tells the browser to download it as a file rather than displaying it as text
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"leaderboard_" + classroomId + ".csv\"");

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
            @RequestBody(required = false) java.util.Map<String, Object> body) {

        String effectiveMentorId = mentorId;
        Long effectiveDeadline = newEndTimestamp;

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