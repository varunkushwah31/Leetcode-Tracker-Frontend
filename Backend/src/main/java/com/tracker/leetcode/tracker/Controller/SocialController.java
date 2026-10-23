package com.tracker.leetcode.tracker.Controller;

import com.tracker.leetcode.tracker.DTO.*;
import com.tracker.leetcode.tracker.Models.Friendship;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Service.SocialService;
import com.tracker.leetcode.tracker.Service.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;
    private final StudentService studentService;

    private String resolveStudentId(Student currentStudent, Authentication authentication) {
        if (currentStudent != null && currentStudent.getId() != null) {
            return currentStudent.getId();
        }
        if (authentication != null && authentication.getName() != null) {
            Student found = studentService.getStudentOrThrow(authentication.getName());
            return found.getId();
        }
        throw new IllegalStateException("Authentication required to access social features.");
    }

    // ==========================================
    // 1. FRIENDS DISCOVERY & MANAGEMENT
    // ==========================================

    @GetMapping("/students/search")
    public ResponseEntity<List<SocialSearchStudentDTO>> searchStudents(
            @RequestParam String q,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.searchStudents(studentId, q));
    }

    @PostMapping("/friends/request/{targetStudentId}")
    public ResponseEntity<Friendship> sendFriendRequest(
            @PathVariable String targetStudentId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.sendFriendRequest(studentId, targetStudentId));
    }

    @PostMapping("/friends/accept/{requestId}")
    public ResponseEntity<Friendship> acceptFriendRequest(
            @PathVariable String requestId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.acceptFriendRequest(studentId, requestId));
    }

    @PostMapping("/friends/reject/{requestId}")
    public ResponseEntity<Map<String, String>> rejectFriendRequest(
            @PathVariable String requestId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        socialService.rejectOrCancelFriendRequest(studentId, requestId);
        return ResponseEntity.ok(Map.of("message", "Friend request rejected or cancelled."));
    }

    @DeleteMapping("/friends/{friendId}")
    public ResponseEntity<Map<String, String>> removeFriend(
            @PathVariable String friendId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        socialService.removeFriend(studentId, friendId);
        return ResponseEntity.ok(Map.of("message", "Friend removed successfully."));
    }

    @GetMapping("/friends")
    public ResponseEntity<Map<String, Object>> getFriends(
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.getFriendsAndRequests(studentId));
    }

    @GetMapping("/friends/{friendId}/dashboard")
    public ResponseEntity<FriendComparisonDTO> getFriendDashboard(
            @PathVariable String friendId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.getFriendDashboard(studentId, friendId));
    }

    // ==========================================
    // 2. PVP DUELS
    // ==========================================

    @PostMapping("/pvp/challenge")
    public ResponseEntity<PvpMatchDTO> createPvpChallenge(
            @RequestBody CreatePvpMatchRequest request,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.createPvpChallenge(studentId, request));
    }

    @PostMapping("/pvp/{matchId}/accept")
    public ResponseEntity<PvpMatchDTO> acceptPvpMatch(
            @PathVariable String matchId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.acceptPvpMatch(studentId, matchId));
    }

    @PostMapping("/pvp/{matchId}/decline")
    public ResponseEntity<PvpMatchDTO> declinePvpMatch(
            @PathVariable String matchId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.declinePvpMatch(studentId, matchId));
    }

    @PostMapping({"/pvp/{matchId}/forfeit", "/pvp/{matchId}/end"})
    public ResponseEntity<PvpMatchDTO> endPvpMatchPreemptively(
            @PathVariable String matchId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.endPvpMatchPreemptively(studentId, matchId));
    }

    @PostMapping("/pvp/{matchId}/verify")
    public ResponseEntity<PvpMatchDTO> verifyPvpMatch(
            @PathVariable String matchId,
            @RequestBody(required = false) PvpVerifyRequest request,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        String submissionUrl = request != null ? request.getSubmissionUrl() : null;
        return ResponseEntity.ok(socialService.verifyPvpMatch(studentId, matchId, submissionUrl));
    }

    @GetMapping("/pvp/matches")
    public ResponseEntity<List<PvpMatchDTO>> getPvpMatches(
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.getPvpMatches(studentId));
    }

    @GetMapping("/pvp/{matchId}")
    public ResponseEntity<PvpMatchDTO> getPvpMatch(@PathVariable String matchId) {
        return ResponseEntity.ok(socialService.getPvpMatch(matchId));
    }

    // ==========================================
    // 3. ACTIVITY FEED & KUDOS
    // ==========================================

    @GetMapping("/activities")
    public ResponseEntity<List<FriendActivityDTO>> getActivities(
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.getActivities(studentId));
    }

    @PostMapping("/activities/{activityId}/react")
    public ResponseEntity<FriendActivityDTO> reactToActivity(
            @PathVariable String activityId,
            @RequestBody(required = false) ReactActivityRequest request,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        String reaction = (request != null && request.getReaction() != null) ? request.getReaction() : "kudos";
        return ResponseEntity.ok(socialService.reactToActivity(studentId, activityId, reaction));
    }

    // ==========================================
    // 4. FRIENDS LEADERBOARD
    // ==========================================

    @GetMapping("/friends/leaderboard")
    public ResponseEntity<List<FriendsLeaderboardEntryDTO>> getFriendsLeaderboard(
            @RequestParam(required = false, defaultValue = "totalSolved") String sortBy,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.getFriendsLeaderboard(studentId, sortBy));
    }

    // ==========================================
    // 5. PEER STUDY HUB
    // ==========================================

    @GetMapping("/peer/posts")
    public ResponseEntity<List<PeerStudyPostDTO>> getPeerStudyPosts(
            @RequestParam(required = false) String topic,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.getPeerStudyPosts(studentId, topic));
    }

    @PostMapping("/peer/posts")
    public ResponseEntity<PeerStudyPostDTO> createPeerStudyPost(
            @RequestBody CreatePeerStudyPostRequest request,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.createPeerStudyPost(studentId, request));
    }

    @PostMapping("/peer/posts/{postId}/replies")
    public ResponseEntity<PeerStudyPostDTO> addPeerStudyReply(
            @PathVariable String postId,
            @RequestBody AddPeerStudyReplyRequest request,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.addPeerStudyReply(studentId, postId, request));
    }

    @PostMapping("/peer/posts/{postId}/like")
    public ResponseEntity<PeerStudyPostDTO> likePeerStudyPost(
            @PathVariable String postId,
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        return ResponseEntity.ok(socialService.toggleLikePeerPost(studentId, postId));
    }

    @GetMapping("/curated-problems")
    public ResponseEntity<List<CuratedProblemDTO>> getCuratedProblems(
            @RequestParam(required = false) String topic
    ) {
        return ResponseEntity.ok(socialService.getCuratedProblems(topic));
    }

    @PostMapping("/presence")
    public ResponseEntity<Map<String, Object>> pingPresence(
            @AuthenticationPrincipal Student currentStudent,
            Authentication authentication
    ) {
        String studentId = resolveStudentId(currentStudent, authentication);
        socialService.touchPresence(studentId);
        return ResponseEntity.ok(Map.of("status", "ACTIVE", "studentId", studentId));
    }
}
