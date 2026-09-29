package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.SystemOverviewDTO;
import com.tracker.leetcode.tracker.Service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost", "http://localhost:80", "http://127.0.0.1:5173", "http://127.0.0.1", "http://127.0.0.1:80"}, allowedHeaders = "*", allowCredentials = "true")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<SystemOverviewDTO> getSystemOverview(){
        return ResponseEntity.ok(adminService.getSystemOverview());
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

}