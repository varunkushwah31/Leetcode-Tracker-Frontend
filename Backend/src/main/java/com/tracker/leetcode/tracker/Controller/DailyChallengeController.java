package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.DailyChallengeDTO;
import com.tracker.leetcode.tracker.Service.DailyChallengeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class DailyChallengeController {

    private final DailyChallengeService dailyChallengeService;

    @GetMapping("/daily")
    public ResponseEntity<DailyChallengeDTO> getDailyChallenge(
            @RequestParam(required = false) String classroomId,
            Authentication authentication
    ) {
        String studentIdentifier = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            studentIdentifier = authentication.getName();
        }

        log.info("Fetching daily challenge for user: {}, classroom: {}", studentIdentifier, classroomId);
        DailyChallengeDTO challenge = dailyChallengeService.getDailyChallenge(studentIdentifier, classroomId);
        return ResponseEntity.ok(challenge);
    }

    @GetMapping("/daily/global")
    public ResponseEntity<DailyChallengeDTO> getGlobalDailyChallenge() {
        log.info("Fetching pure global LeetCode POTD (no user context).");
        return ResponseEntity.ok(dailyChallengeService.getGlobalDailyChallenge());
    }
}
