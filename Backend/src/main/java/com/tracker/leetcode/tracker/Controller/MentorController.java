package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.MentorDTO;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Service.MentorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/mentors")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    // 1. Register / Create a Mentor
    @PostMapping
    public ResponseEntity<MentorDTO> createMentor(@Valid @RequestBody RegisterRequest request) {
        Mentor mentor = new Mentor();
        mentor.setName(request.name());
        mentor.setEmail(request.email());
        mentor.setPassword(request.password());
        return ResponseEntity.ok(mentorService.createMentor(mentor));
    }

    // 2. Get a Mentor Profile
    @GetMapping("/{id}")
    public ResponseEntity<MentorDTO> getMentor(@PathVariable String id) {
        return ResponseEntity.ok(mentorService.getMentorById(id));
    }

    // 3. Get All Mentors (Admin view)
    @GetMapping
    public ResponseEntity<List<MentorDTO>> getAllMentors() {
        return ResponseEntity.ok(mentorService.getAllMentors());
    }
}
