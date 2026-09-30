package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.Models.LearningPath;
import com.tracker.leetcode.tracker.Service.LearningPathService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/paths")
@RequiredArgsConstructor
public class LearningPathController {

    private final LearningPathService pathService;

    // POST /api/paths
    @PostMapping
    public ResponseEntity<LearningPath> createPath(@RequestBody LearningPath path) {
        return ResponseEntity.ok(pathService.createPath(path));
    }

    // GET /api/paths/mentor/{mentorId}
    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<LearningPath>> getMentorPaths(@PathVariable String mentorId) {
        return ResponseEntity.ok(pathService.getPathsByMentor(mentorId));
    }

    // POST /api/paths/{pathId}/assign/{classroomId}
    @PostMapping("/{pathId}/assign/{classroomId}")
    public ResponseEntity<String> assignPathToClassroom(
            @PathVariable String pathId,
            @PathVariable String classroomId) {

        pathService.assignPathToClassroom(pathId, classroomId);
        return ResponseEntity.ok("Learning Path assigned successfully!");
    }
}