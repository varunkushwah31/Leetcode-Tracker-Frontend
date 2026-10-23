package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.CreateLearningPathRequest;
import com.tracker.leetcode.tracker.Models.LearningPath;
import com.tracker.leetcode.tracker.Service.LearningPathService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/paths")
@RequiredArgsConstructor
public class LearningPathController {

    private final LearningPathService pathService;

    @PostMapping
    public ResponseEntity<LearningPath> createPath(@RequestBody CreateLearningPathRequest request) {
        LearningPath path = new LearningPath();
        path.setMentorId(request.mentorId());
        path.setTitle(request.title());
        path.setDescription(request.description());
        path.setQuestions(request.questions() != null ? request.questions() : new ArrayList<>());
        return ResponseEntity.ok(pathService.createPath(path));
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<LearningPath>> getMentorPaths(@PathVariable String mentorId) {
        return ResponseEntity.ok(pathService.getPathsByMentor(mentorId));
    }

    @PostMapping("/{pathId}/assign/{classroomId}")
    public ResponseEntity<String> assignPathToClassroom(
            @PathVariable String pathId,
            @PathVariable String classroomId) {

        pathService.assignPathToClassroom(pathId, classroomId);
        return ResponseEntity.ok("Learning Path assigned successfully!");
    }
}
