package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.UpcomingContestDTO;
import com.tracker.leetcode.tracker.Service.ContestScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestScheduleService contestScheduleService;

    @GetMapping("/upcoming")
    public ResponseEntity<List<UpcomingContestDTO>> getUpcomingContests(
            @RequestParam(required = false, defaultValue = "ALL") String platform
    ) {
        log.info("Request for upcoming contests with platform filter: {}", platform);
        List<UpcomingContestDTO> contests = contestScheduleService.getUpcomingContests(platform);
        return ResponseEntity.ok(contests);
    }
}
