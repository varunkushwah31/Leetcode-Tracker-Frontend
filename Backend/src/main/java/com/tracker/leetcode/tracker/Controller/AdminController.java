package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.MentorDTO;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.DTO.StudentSummaryDTO;
import com.tracker.leetcode.tracker.DTO.SystemOverviewDTO;
import com.tracker.leetcode.tracker.Service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<SystemOverviewDTO> getSystemOverview(){
        return ResponseEntity.ok(adminService.getSystemOverview());
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentSummaryDTO>> getAllStudents() {
        return ResponseEntity.ok(adminService.getAllStudents());
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable String id) {
        adminService.deleteStudent(id);
        return ResponseEntity.ok(Map.of("message", "Student deleted successfully."));
    }

    @PostMapping("/students/{id}/sync")
    public ResponseEntity<?> syncStudent(@PathVariable String id) {
        return ResponseEntity.ok(adminService.syncStudent(id));
    }

    @PostMapping("/mentors")
    public ResponseEntity<MentorDTO> createMentor(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(adminService.createMentor(request));
    }

    @DeleteMapping("/mentors/{id}")
    public ResponseEntity<?> deleteMentor(@PathVariable String id) {
        adminService.deleteMentor(id);
        return ResponseEntity.ok(Map.of("message", "Mentor and associated classrooms deleted successfully."));
    }

    @DeleteMapping("/classrooms/{id}")
    public ResponseEntity<?> deleteClassroom(@PathVariable String id) {
        adminService.deleteClassroom(id);
        return ResponseEntity.ok(Map.of("message", "Classroom deleted successfully."));
    }

    @PostMapping("/sync-all")
    public ResponseEntity<?> forceGlobalSync() {
        return ResponseEntity.ok(adminService.forceGlobalSync());
    }

    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        return ResponseEntity.ok(adminService.getCacheStats());
    }

    @PostMapping("/cache/clear")
    public ResponseEntity<Map<String, String>> clearCache(@RequestParam(required = false) String cacheName) {
        return ResponseEntity.ok(adminService.clearCache(cacheName));
    }
}