package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.*;
import com.tracker.leetcode.tracker.Exception.StudentNotFoundException;
import com.tracker.leetcode.tracker.Mapper.StudentMapper;
import com.tracker.leetcode.tracker.Models.*;
import com.tracker.leetcode.tracker.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialService {

    private final StudentRepository studentRepository;
    private final FriendshipRepository friendshipRepository;
    private final PvpMatchRepository pvpMatchRepository;
    private final FriendActivityRepository friendActivityRepository;
    private final PeerStudyPostRepository peerStudyPostRepository;
    private final StudentService studentService;
    private final StudentMapper studentMapper;
    private final CuratedTopicCatalog curatedTopicCatalog;

    // ==========================================
    // 1. FRIEND MANAGEMENT & DISCOVERY
    // ==========================================

    public List<SocialSearchStudentDTO> searchStudents(String currentStudentId, String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        String cleanQuery = query.trim().toLowerCase();

        // Retrieve all friendships involving the current student
        List<Friendship> myFriendships = friendshipRepository.findAllByStudentId(currentStudentId);
        Map<String, Friendship> friendshipByTarget = new HashMap<>();
        for (Friendship f : myFriendships) {
            String otherId = f.getRequesterId().equals(currentStudentId) ? f.getReceiverId() : f.getRequesterId();
            friendshipByTarget.put(otherId, f);
        }

        return studentRepository.findAll().stream()
                .filter(s -> !s.getId().equals(currentStudentId))
                .filter(s -> {
                    boolean matchName = s.getName() != null && s.getName().toLowerCase().contains(cleanQuery);
                    boolean matchEmail = s.getEmail() != null && s.getEmail().toLowerCase().contains(cleanQuery);
                    boolean matchLc = s.getLeetcodeUsername() != null && s.getLeetcodeUsername().toLowerCase().contains(cleanQuery);
                    boolean matchCf = s.getCodeforcesHandle() != null && s.getCodeforcesHandle().toLowerCase().contains(cleanQuery);
                    return matchName || matchEmail || matchLc || matchCf;
                })
                .limit(25)
                .map(s -> {
                    String status = "NONE";
                    String friendshipId = null;
                    Friendship f = friendshipByTarget.get(s.getId());
                    if (f != null) {
                        friendshipId = f.getId();
                        if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                            status = "ACCEPTED";
                        } else if (f.getStatus() == FriendshipStatus.PENDING) {
                            status = f.getRequesterId().equals(currentStudentId) ? "PENDING_OUTGOING" : "PENDING_INCOMING";
                        }
                    }

                    int lcSolved = studentMapper.calculateLeetcodeSolved(s.getProblemStats());
                    int cfSolved = s.getCodeforcesSolvedCount() != null ? s.getCodeforcesSolvedCount() : 0;

                    return SocialSearchStudentDTO.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .email(s.getEmail())
                            .leetcodeUsername(s.getLeetcodeUsername())
                            .codeforcesHandle(s.getCodeforcesHandle())
                            .avatarUrl(s.getAvatarUrl())
                            .totalSolved(lcSolved + cfSolved)
                            .currentContestRating(s.getCurrentContestRating())
                            .codeforcesRating(s.getCodeforcesRating())
                            .streak(s.getStreak() != null ? s.getStreak() : 0)
                            .friendshipStatus(status)
                            .friendshipId(friendshipId)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public Friendship sendFriendRequest(String requesterId, String targetStudentId) {
        if (requesterId.equals(targetStudentId)) {
            throw new IllegalArgumentException("You cannot send a friend request to yourself.");
        }

        Student requester = studentRepository.findById(requesterId)
                .orElseThrow(() -> new StudentNotFoundException("Requester not found"));
        Student target = studentRepository.findById(targetStudentId)
                .orElseThrow(() -> new StudentNotFoundException("Target student not found"));

        Optional<Friendship> existing = friendshipRepository.findBetween(requesterId, targetStudentId);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new IllegalStateException("You are already friends with " + target.getName() + ".");
            }
            if (f.getStatus() == FriendshipStatus.PENDING) {
                if (f.getRequesterId().equals(requesterId)) {
                    throw new IllegalStateException("Friend request already sent.");
                } else {
                    // Reciprocal request -> Auto-accept!
                    return acceptFriendRequest(requesterId, f.getId());
                }
            }
            // If rejected previously, reset to PENDING
            f.setRequesterId(requesterId);
            f.setReceiverId(targetStudentId);
            f.setStatus(FriendshipStatus.PENDING);
            f.setUpdatedAt(Instant.now());
            return friendshipRepository.save(f);
        }

        Friendship friendship = Friendship.builder()
                .requesterId(requesterId)
                .receiverId(targetStudentId)
                .status(FriendshipStatus.PENDING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return friendshipRepository.save(friendship);
    }

    public Friendship acceptFriendRequest(String currentStudentId, String friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friendship request not found"));

        if (!friendship.getReceiverId().equals(currentStudentId) && !friendship.getRequesterId().equals(currentStudentId)) {
            throw new IllegalStateException("You are not authorized to accept this friend request.");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendship.setUpdatedAt(Instant.now());
        Friendship saved = friendshipRepository.save(friendship);

        // Update both students' friend lists
        Student requester = studentRepository.findById(friendship.getRequesterId()).orElse(null);
        Student receiver = studentRepository.findById(friendship.getReceiverId()).orElse(null);

        if (requester != null && receiver != null) {
            if (requester.getFriendIds() == null) requester.setFriendIds(new ArrayList<>());
            if (!requester.getFriendIds().contains(receiver.getId())) {
                requester.getFriendIds().add(receiver.getId());
                studentRepository.save(requester);
            }

            if (receiver.getFriendIds() == null) receiver.setFriendIds(new ArrayList<>());
            if (!receiver.getFriendIds().contains(requester.getId())) {
                receiver.getFriendIds().add(requester.getId());
                studentRepository.save(receiver);
            }

            // Create friend activity
            recordActivity(
                    requester,
                    FriendActivityType.NEW_FRIEND,
                    "New Friendship Formed",
                    requester.getName() + " and " + receiver.getName() + " became friends! Start competing and solving together.",
                    null,
                    null,
                    null
            );
        }

        return saved;
    }

    public void rejectOrCancelFriendRequest(String currentStudentId, String friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friendship request not found"));

        if (!friendship.getReceiverId().equals(currentStudentId) && !friendship.getRequesterId().equals(currentStudentId)) {
            throw new IllegalStateException("You are not authorized to modify this friend request.");
        }

        friendshipRepository.delete(friendship);
    }

    public void removeFriend(String currentStudentId, String friendId) {
        Optional<Friendship> friendshipOpt = friendshipRepository.findBetween(currentStudentId, friendId);
        friendshipOpt.ifPresent(friendshipRepository::delete);

        Student student = studentRepository.findById(currentStudentId).orElse(null);
        if (student != null && student.getFriendIds() != null) {
            student.getFriendIds().remove(friendId);
            studentRepository.save(student);
        }

        Student friend = studentRepository.findById(friendId).orElse(null);
        if (friend != null && friend.getFriendIds() != null) {
            friend.getFriendIds().remove(currentStudentId);
            studentRepository.save(friend);
        }
    }

    public Map<String, Object> getFriendsAndRequests(String currentStudentId) {
        List<Friendship> allFriendships = friendshipRepository.findAllByStudentId(currentStudentId);

        List<FriendDTO> acceptedFriends = new ArrayList<>();
        List<FriendRequestDTO> pendingIncoming = new ArrayList<>();
        List<FriendRequestDTO> pendingOutgoing = new ArrayList<>();

        for (Friendship f : allFriendships) {
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                String friendId = f.getRequesterId().equals(currentStudentId) ? f.getReceiverId() : f.getRequesterId();
                Student friend = studentRepository.findById(friendId).orElse(null);
                if (friend != null) {
                    int lcSolved = studentMapper.calculateLeetcodeSolved(friend.getProblemStats());
                    int cfSolved = friend.getCodeforcesSolvedCount() != null ? friend.getCodeforcesSolvedCount() : 0;

                    acceptedFriends.add(FriendDTO.builder()
                            .id(friend.getId())
                            .friendshipId(f.getId())
                            .name(friend.getName())
                            .email(friend.getEmail())
                            .leetcodeUsername(friend.getLeetcodeUsername())
                            .codeforcesHandle(friend.getCodeforcesHandle())
                            .avatarUrl(friend.getAvatarUrl())
                            .currentContestRating(friend.getCurrentContestRating())
                            .codeforcesRating(friend.getCodeforcesRating())
                            .leetcodeSolvedCount(lcSolved)
                            .codeforcesSolvedCount(cfSolved)
                            .totalSolved(lcSolved + cfSolved)
                            .streak(friend.getStreak() != null ? friend.getStreak() : 0)
                            .pvpWins(friend.getPvpWins() != null ? friend.getPvpWins() : 0)
                            .pvpLosses(friend.getPvpLosses() != null ? friend.getPvpLosses() : 0)
                            .status("ACCEPTED")
                            .friendSince(f.getUpdatedAt() != null ? f.getUpdatedAt() : f.getCreatedAt())
                            .lastActive(friend.getLastSyncedAt())
                            .build());
                }
            } else if (f.getStatus() == FriendshipStatus.PENDING) {
                if (f.getReceiverId().equals(currentStudentId)) {
                    // Incoming
                    Student req = studentRepository.findById(f.getRequesterId()).orElse(null);
                    if (req != null) {
                        pendingIncoming.add(FriendRequestDTO.builder()
                                .id(f.getId())
                                .requesterId(req.getId())
                                .requesterName(req.getName())
                                .requesterHandle(req.getLeetcodeUsername() != null ? req.getLeetcodeUsername() : req.getCodeforcesHandle())
                                .requesterAvatarUrl(req.getAvatarUrl())
                                .receiverId(currentStudentId)
                                .status("PENDING")
                                .createdAt(f.getCreatedAt())
                                .build());
                    }
                } else {
                    // Outgoing
                    Student rec = studentRepository.findById(f.getReceiverId()).orElse(null);
                    if (rec != null) {
                        pendingOutgoing.add(FriendRequestDTO.builder()
                                .id(f.getId())
                                .requesterId(currentStudentId)
                                .receiverId(rec.getId())
                                .receiverName(rec.getName())
                                .receiverHandle(rec.getLeetcodeUsername() != null ? rec.getLeetcodeUsername() : rec.getCodeforcesHandle())
                                .receiverAvatarUrl(rec.getAvatarUrl())
                                .status("PENDING")
                                .createdAt(f.getCreatedAt())
                                .build());
                    }
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("friends", acceptedFriends);
        result.put("pendingIncoming", pendingIncoming);
        result.put("pendingOutgoing", pendingOutgoing);
        return result;
    }

    // ==========================================
    // 2. FRIEND DASHBOARD & PEER COMPARISON
    // ==========================================

    public FriendComparisonDTO getFriendDashboard(String currentStudentId, String friendId) {
        // Verify friendship
        Optional<Friendship> friendship = friendshipRepository.findBetween(currentStudentId, friendId);
        if (friendship.isEmpty() || friendship.get().getStatus() != FriendshipStatus.ACCEPTED) {
            throw new IllegalStateException("You can only view dashboards of accepted friends.");
        }

        Student user = studentRepository.findById(currentStudentId)
                .orElseThrow(() -> new StudentNotFoundException("Current student not found"));
        Student friend = studentRepository.findById(friendId)
                .orElseThrow(() -> new StudentNotFoundException("Friend not found"));

        // Build extended DTO
        StudentExtendedDTO friendDTO = studentMapper.toExtendedDTO(friend);

        // Problem overlap comparison
        Map<String, String> userCatalog = extractSolvedCatalog(user);
        Map<String, String> friendCatalog = extractSolvedCatalog(friend);

        List<String> mutualSolved = new ArrayList<>();
        List<String> friendOnlySolved = new ArrayList<>();
        List<String> userOnlySolved = new ArrayList<>();

        for (Map.Entry<String, String> entry : friendCatalog.entrySet()) {
            if (userCatalog.containsKey(entry.getKey())) {
                mutualSolved.add(entry.getValue());
            } else {
                friendOnlySolved.add(entry.getValue());
            }
        }

        for (Map.Entry<String, String> entry : userCatalog.entrySet()) {
            if (!friendCatalog.containsKey(entry.getKey())) {
                userOnlySolved.add(entry.getValue());
            }
        }

        // Head-to-head PVP record
        List<PvpMatch> matches = pvpMatchRepository.findHeadToHeadCompleted(currentStudentId, friendId);
        int userWins = 0;
        int friendWins = 0;
        int draws = 0;

        for (PvpMatch m : matches) {
            if (currentStudentId.equals(m.getWinnerId())) {
                userWins++;
            } else if (friendId.equals(m.getWinnerId())) {
                friendWins++;
            } else {
                draws++;
            }
        }

        int userLc = studentMapper.calculateLeetcodeSolved(user.getProblemStats());
        int userCf = user.getCodeforcesSolvedCount() != null ? user.getCodeforcesSolvedCount() : 0;
        int friendLc = studentMapper.calculateLeetcodeSolved(friend.getProblemStats());
        int friendCf = friend.getCodeforcesSolvedCount() != null ? friend.getCodeforcesSolvedCount() : 0;

        return FriendComparisonDTO.builder()
                .friendProfile(friendDTO)
                .mutualSolved(mutualSolved)
                .friendOnlySolved(friendOnlySolved)
                .userOnlySolved(userOnlySolved)
                .userSolvedCount(userLc + userCf)
                .friendSolvedCount(friendLc + friendCf)
                .userRating(user.getCurrentContestRating())
                .friendRating(friend.getCurrentContestRating())
                .userStreak(user.getStreak() != null ? user.getStreak() : 0)
                .friendStreak(friend.getStreak() != null ? friend.getStreak() : 0)
                .userPvpWinsAgainstFriend(userWins)
                .friendPvpWinsAgainstUser(friendWins)
                .pvpDraws(draws)
                .build();
    }

    private String toKebabSlug(String text) {
        if (text == null || text.isBlank()) return "";
        return text.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }

    private Map<String, String> extractSolvedCatalog(Student student) {
        Map<String, String> catalog = new LinkedHashMap<>();
        if (student.getRecentSubmissions() != null) {
            for (RecentSubmission sub : student.getRecentSubmissions()) {
                String canonical = null;
                if (sub.getTitleSlug() != null && !sub.getTitleSlug().isBlank()) {
                    canonical = sub.getTitleSlug().trim().toLowerCase();
                } else if (sub.getTitle() != null && !sub.getTitle().isBlank()) {
                    canonical = toKebabSlug(sub.getTitle());
                }
                if (canonical != null && !canonical.isEmpty()) {
                    String normKey = StudentMapper.normalizeSlug(canonical);
                    catalog.putIfAbsent(normKey, canonical);
                }
            }
        }
        if (student.getManuallyCompletedAssignments() != null) {
            for (String assId : student.getManuallyCompletedAssignments()) {
                if (assId != null && !assId.isBlank()) {
                    String canonical = assId.trim().toLowerCase();
                    String normKey = StudentMapper.normalizeSlug(canonical);
                    catalog.putIfAbsent(normKey, canonical);
                }
            }
        }
        return catalog;
    }

    // ==========================================
    // 3. PVP DUELS & PEER COMPETITIONS
    // ==========================================

    public PvpMatchDTO createPvpChallenge(String challengerId, CreatePvpMatchRequest request) {
        Student challenger = studentRepository.findById(challengerId)
                .orElseThrow(() -> new StudentNotFoundException("Challenger not found"));
        Student opponent = studentRepository.findById(request.getOpponentId())
                .orElseThrow(() -> new StudentNotFoundException("Opponent not found"));

        // Validate friend
        Optional<Friendship> friendship = friendshipRepository.findBetween(challengerId, request.getOpponentId());
        if (friendship.isEmpty() || friendship.get().getStatus() != FriendshipStatus.ACCEPTED) {
            throw new IllegalStateException("You can only duel with accepted friends.");
        }

        // Pick problem
        String title;
        String slug;
        String link;
        String topic = request.getProblemTopic() != null ? request.getProblemTopic() : "Dynamic Programming";
        String difficulty = request.getProblemDifficulty() != null ? request.getProblemDifficulty() : "Medium";
        Platform platform = Platform.LEETCODE;

        if (request.getCustomProblemTitle() != null && !request.getCustomProblemTitle().isBlank()) {
            title = request.getCustomProblemTitle();
            slug = request.getCustomProblemSlug() != null ? request.getCustomProblemSlug() : StudentMapper.normalizeSlug(title);
            link = request.getCustomProblemLink() != null ? request.getCustomProblemLink() : "https://leetcode.com/problems/" + slug + "/";
        } else {
            CuratedProblemDTO curated = curatedTopicCatalog.getRandomOrTopicProblem(topic, difficulty);
            title = curated.getTitle();
            slug = curated.getTitleSlug();
            link = curated.getLink();
            if (curated.getDifficulty() != null) difficulty = curated.getDifficulty();
            if (curated.getTopic() != null) topic = curated.getTopic();
        }

        int duration = request.getDurationMinutes() > 0 ? Math.min(Math.max(request.getDurationMinutes(), 10), 120) : 30;

        PvpMatch match = PvpMatch.builder()
                .challengerId(challenger.getId())
                .challengerName(challenger.getName())
                .challengerHandle(challenger.getLeetcodeUsername() != null ? challenger.getLeetcodeUsername() : challenger.getCodeforcesHandle())
                .challengerAvatarUrl(challenger.getAvatarUrl())
                .opponentId(opponent.getId())
                .opponentName(opponent.getName())
                .opponentHandle(opponent.getLeetcodeUsername() != null ? opponent.getLeetcodeUsername() : opponent.getCodeforcesHandle())
                .opponentAvatarUrl(opponent.getAvatarUrl())
                .problemTitle(title)
                .problemSlug(slug)
                .problemPlatform(platform)
                .problemDifficulty(difficulty)
                .problemLink(link)
                .problemTopic(topic)
                .durationMinutes(duration)
                .status(PvpMatchStatus.INVITED)
                .createdAt(Instant.now())
                .build();

        PvpMatch saved = pvpMatchRepository.save(match);

        // Record Activity
        recordActivity(
                challenger,
                FriendActivityType.PROBLEM_SOLVED,
                "PVP Challenge Issued!",
                challenger.getName() + " challenged " + opponent.getName() + " to a 1v1 Problem Duel on '" + title + "' (" + difficulty + ")!",
                link,
                platform,
                difficulty
        );

        return toPvpMatchDTO(saved);
    }

    public PvpMatchDTO acceptPvpMatch(String currentStudentId, String matchId) {
        PvpMatch match = pvpMatchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if (!match.getOpponentId().equals(currentStudentId)) {
            throw new IllegalStateException("Only the invited opponent can accept this duel.");
        }
        if (match.getStatus() != PvpMatchStatus.INVITED) {
            throw new IllegalStateException("Match cannot be accepted (current status: " + match.getStatus() + ")");
        }

        Instant now = Instant.now();
        match.setStatus(PvpMatchStatus.IN_PROGRESS);
        match.setStartedAt(now);
        match.setExpiresAt(now.plus(Duration.ofMinutes(match.getDurationMinutes())));

        PvpMatch saved = pvpMatchRepository.save(match);
        return toPvpMatchDTO(saved);
    }

    public PvpMatchDTO declinePvpMatch(String currentStudentId, String matchId) {
        PvpMatch match = pvpMatchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if (!match.getOpponentId().equals(currentStudentId) && !match.getChallengerId().equals(currentStudentId)) {
            throw new IllegalStateException("Not authorized to decline this match.");
        }

        match.setStatus(PvpMatchStatus.DECLINED);
        match.setCompletedAt(Instant.now());
        PvpMatch saved = pvpMatchRepository.save(match);
        return toPvpMatchDTO(saved);
    }

    public PvpMatchDTO verifyPvpMatch(String currentStudentId, String matchId, String submissionUrl) {
        PvpMatch match = pvpMatchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if (!match.getChallengerId().equals(currentStudentId) && !match.getOpponentId().equals(currentStudentId)) {
            throw new IllegalStateException("You are not a participant in this duel.");
        }

        Instant now = Instant.now();

        // Check if expired
        if (match.getExpiresAt() != null && now.isAfter(match.getExpiresAt()) && match.getStatus() == PvpMatchStatus.IN_PROGRESS) {
            resolveExpiredMatch(match);
            return toPvpMatchDTO(pvpMatchRepository.save(match));
        }

        if (match.getStatus() != PvpMatchStatus.IN_PROGRESS) {
            return toPvpMatchDTO(match);
        }

        Student student = studentRepository.findById(currentStudentId).orElse(null);
        if (student == null) {
            throw new StudentNotFoundException("Student not found");
        }

        // Try syncing submissions if LeetCode or Codeforces handle is available
        try {
            if (student.getLeetcodeUsername() != null && !student.getLeetcodeUsername().isBlank()) {
                Student updated = studentService.fetchAndUpdateRecentSubmissions(student.getLeetcodeUsername());
                if (updated != null) {
                    student = updated;
                }
            }
        } catch (Exception ex) {
            log.warn("Background recent submissions fetch warning during PVP verify: {}", ex.getMessage());
        }

        boolean solved = false;
        String normProblemSlug = StudentMapper.normalizeSlug(match.getProblemSlug());

        if (student.getRecentSubmissions() != null) {
            solved = student.getRecentSubmissions().stream().anyMatch(sub -> {
                String subSlug = StudentMapper.normalizeSlug(sub.getTitleSlug() != null ? sub.getTitleSlug() : sub.getTitle());
                return subSlug.equals(normProblemSlug) || normProblemSlug.contains(subSlug) || subSlug.contains(normProblemSlug);
            });
        }

        // If manual submission URL was provided and contains slug/title or leetcode.com
        if (!solved && submissionUrl != null && !submissionUrl.isBlank()) {
            if (submissionUrl.toLowerCase().contains("leetcode.com") || submissionUrl.toLowerCase().contains("codeforces.com")) {
                solved = true;
            }
        }

        if (solved) {
            boolean isChallenger = match.getChallengerId().equals(currentStudentId);
            if (isChallenger && !match.isChallengerSolved()) {
                match.setChallengerSolved(true);
                match.setChallengerSolvedAt(now);
                match.setChallengerSubmissionUrl(submissionUrl);
            } else if (!isChallenger && !match.isOpponentSolved()) {
                match.setOpponentSolved(true);
                match.setOpponentSolvedAt(now);
                match.setOpponentSubmissionUrl(submissionUrl);
            }

            // Speed duel rule: First to verify solve wins!
            match.setStatus(PvpMatchStatus.COMPLETED);
            match.setCompletedAt(now);
            match.setWinnerId(currentStudentId);
            match.setWinnerName(isChallenger ? match.getChallengerName() : match.getOpponentName());

            updatePvpStats(match.getWinnerId(), isChallenger ? match.getOpponentId() : match.getChallengerId(), false);

            // Emit activity
            recordActivity(
                    student,
                    FriendActivityType.PVP_WIN,
                    "PVP Duel Victory! 🏆",
                    match.getWinnerName() + " won the 1v1 Problem Duel on '" + match.getProblemTitle() + "'!",
                    match.getProblemLink(),
                    match.getProblemPlatform(),
                    match.getProblemDifficulty()
            );
        }

        PvpMatch saved = pvpMatchRepository.save(match);
        return toPvpMatchDTO(saved);
    }

    private void resolveExpiredMatch(PvpMatch match) {
        match.setCompletedAt(Instant.now());
        if (match.isChallengerSolved() && !match.isOpponentSolved()) {
            match.setStatus(PvpMatchStatus.COMPLETED);
            match.setWinnerId(match.getChallengerId());
            match.setWinnerName(match.getChallengerName());
            updatePvpStats(match.getChallengerId(), match.getOpponentId(), false);
        } else if (match.isOpponentSolved() && !match.isChallengerSolved()) {
            match.setStatus(PvpMatchStatus.COMPLETED);
            match.setWinnerId(match.getOpponentId());
            match.setWinnerName(match.getOpponentName());
            updatePvpStats(match.getOpponentId(), match.getChallengerId(), false);
        } else if (match.isChallengerSolved() && match.isOpponentSolved()) {
            match.setStatus(PvpMatchStatus.COMPLETED);
            if (match.getChallengerSolvedAt().isBefore(match.getOpponentSolvedAt())) {
                match.setWinnerId(match.getChallengerId());
                match.setWinnerName(match.getChallengerName());
                updatePvpStats(match.getChallengerId(), match.getOpponentId(), false);
            } else {
                match.setWinnerId(match.getOpponentId());
                match.setWinnerName(match.getOpponentName());
                updatePvpStats(match.getOpponentId(), match.getChallengerId(), false);
            }
        } else {
            match.setStatus(PvpMatchStatus.DRAW);
            updatePvpStats(match.getChallengerId(), match.getOpponentId(), true);
        }
    }

    private void updatePvpStats(String winnerId, String loserId, boolean isDraw) {
        if (isDraw) {
            Student a = studentRepository.findById(winnerId).orElse(null);
            if (a != null) {
                a.setPvpDraws((a.getPvpDraws() != null ? a.getPvpDraws() : 0) + 1);
                studentRepository.save(a);
            }
            Student b = studentRepository.findById(loserId).orElse(null);
            if (b != null) {
                b.setPvpDraws((b.getPvpDraws() != null ? b.getPvpDraws() : 0) + 1);
                studentRepository.save(b);
            }
        } else {
            Student winner = studentRepository.findById(winnerId).orElse(null);
            if (winner != null) {
                winner.setPvpWins((winner.getPvpWins() != null ? winner.getPvpWins() : 0) + 1);
                studentRepository.save(winner);
            }
            Student loser = studentRepository.findById(loserId).orElse(null);
            if (loser != null) {
                loser.setPvpLosses((loser.getPvpLosses() != null ? loser.getPvpLosses() : 0) + 1);
                studentRepository.save(loser);
            }
        }
    }

    public List<PvpMatchDTO> getPvpMatches(String currentStudentId) {
        List<PvpMatch> matches = pvpMatchRepository.findByStudentId(currentStudentId);
        Instant now = Instant.now();

        // Auto-expire any in-progress matches that ran out of time
        for (PvpMatch m : matches) {
            if (m.getStatus() == PvpMatchStatus.IN_PROGRESS && m.getExpiresAt() != null && now.isAfter(m.getExpiresAt())) {
                resolveExpiredMatch(m);
                pvpMatchRepository.save(m);
            }
        }

        return matches.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toPvpMatchDTO)
                .collect(Collectors.toList());
    }

    public PvpMatchDTO getPvpMatch(String matchId) {
        PvpMatch match = pvpMatchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if (match.getStatus() == PvpMatchStatus.IN_PROGRESS && match.getExpiresAt() != null && Instant.now().isAfter(match.getExpiresAt())) {
            resolveExpiredMatch(match);
            match = pvpMatchRepository.save(match);
        }

        return toPvpMatchDTO(match);
    }

    private PvpMatchDTO toPvpMatchDTO(PvpMatch m) {
        Long remainingSeconds = null;
        if (m.getStatus() == PvpMatchStatus.IN_PROGRESS && m.getExpiresAt() != null) {
            remainingSeconds = Math.max(0, Duration.between(Instant.now(), m.getExpiresAt()).getSeconds());
        }

        return PvpMatchDTO.builder()
                .id(m.getId())
                .challengerId(m.getChallengerId())
                .challengerName(m.getChallengerName())
                .challengerHandle(m.getChallengerHandle())
                .challengerAvatarUrl(m.getChallengerAvatarUrl())
                .opponentId(m.getOpponentId())
                .opponentName(m.getOpponentName())
                .opponentHandle(m.getOpponentHandle())
                .opponentAvatarUrl(m.getOpponentAvatarUrl())
                .problemTitle(m.getProblemTitle())
                .problemSlug(m.getProblemSlug())
                .problemPlatform(m.getProblemPlatform())
                .problemDifficulty(m.getProblemDifficulty())
                .problemLink(m.getProblemLink())
                .problemTopic(m.getProblemTopic())
                .durationMinutes(m.getDurationMinutes())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .startedAt(m.getStartedAt())
                .expiresAt(m.getExpiresAt())
                .completedAt(m.getCompletedAt())
                .challengerSolved(m.isChallengerSolved())
                .challengerSolvedAt(m.getChallengerSolvedAt())
                .challengerSubmissionUrl(m.getChallengerSubmissionUrl())
                .opponentSolved(m.isOpponentSolved())
                .opponentSolvedAt(m.getOpponentSolvedAt())
                .opponentSubmissionUrl(m.getOpponentSubmissionUrl())
                .winnerId(m.getWinnerId())
                .winnerName(m.getWinnerName())
                .remainingSeconds(remainingSeconds)
                .build();
    }

    // ==========================================
    // 4. FRIEND ACTIVITY STREAM & KUDOS
    // ==========================================

    public List<FriendActivityDTO> getActivities(String currentStudentId) {
        Student current = studentRepository.findById(currentStudentId).orElse(null);
        List<String> participantIds = new ArrayList<>();
        participantIds.add(currentStudentId);
        if (current != null && current.getFriendIds() != null) {
            participantIds.addAll(current.getFriendIds());
        }

        List<FriendActivity> activities = friendActivityRepository.findByStudentIdInOrderByCreatedAtDesc(
                participantIds, PageRequest.of(0, 40)
        );

        if (activities.isEmpty()) {
            activities = friendActivityRepository.findTop50ByOrderByCreatedAtDesc();
        }

        return activities.stream().map(a -> {
            int kudosCount = a.getKudosUserIds() != null ? a.getKudosUserIds().size() : 0;
            boolean userReacted = a.getKudosUserIds() != null && a.getKudosUserIds().contains(currentStudentId);

            Map<String, Integer> counts = new HashMap<>();
            List<String> myReactions = new ArrayList<>();
            if (a.getReactions() != null) {
                for (Map.Entry<String, List<String>> entry : a.getReactions().entrySet()) {
                    counts.put(entry.getKey(), entry.getValue().size());
                    if (entry.getValue().contains(currentStudentId)) {
                        myReactions.add(entry.getKey());
                    }
                }
            }

            return FriendActivityDTO.builder()
                    .id(a.getId())
                    .studentId(a.getStudentId())
                    .studentName(a.getStudentName())
                    .studentHandle(a.getStudentHandle())
                    .studentAvatarUrl(a.getStudentAvatarUrl())
                    .type(a.getType())
                    .title(a.getTitle())
                    .description(a.getDescription())
                    .link(a.getLink())
                    .platform(a.getPlatform())
                    .difficulty(a.getDifficulty())
                    .kudosCount(kudosCount)
                    .userReacted(userReacted)
                    .reactionCounts(counts)
                    .myReactions(myReactions)
                    .createdAt(a.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    public FriendActivityDTO reactToActivity(String currentStudentId, String activityId, String reaction) {
        FriendActivity activity = friendActivityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found"));

        if (reaction == null || reaction.isBlank()) {
            reaction = "🔥";
        }
        String emoji = reaction.trim();

        if (activity.getKudosUserIds() == null) activity.setKudosUserIds(new HashSet<>());
        if (activity.getReactions() == null) activity.setReactions(new HashMap<>());

        activity.getKudosUserIds().add(currentStudentId);

        List<String> reactUsers = activity.getReactions().computeIfAbsent(emoji, k -> new ArrayList<>());
        if (reactUsers.contains(currentStudentId)) {
            reactUsers.remove(currentStudentId);
            if (reactUsers.isEmpty()) activity.getReactions().remove(emoji);
        } else {
            reactUsers.add(currentStudentId);
        }

        FriendActivity saved = friendActivityRepository.save(activity);

        Map<String, Integer> counts = new HashMap<>();
        List<String> myReactions = new ArrayList<>();
        if (saved.getReactions() != null) {
            for (Map.Entry<String, List<String>> entry : saved.getReactions().entrySet()) {
                counts.put(entry.getKey(), entry.getValue().size());
                if (entry.getValue().contains(currentStudentId)) {
                    myReactions.add(entry.getKey());
                }
            }
        }

        return FriendActivityDTO.builder()
                .id(saved.getId())
                .studentId(saved.getStudentId())
                .studentName(saved.getStudentName())
                .studentHandle(saved.getStudentHandle())
                .studentAvatarUrl(saved.getStudentAvatarUrl())
                .type(saved.getType())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .link(saved.getLink())
                .platform(saved.getPlatform())
                .difficulty(saved.getDifficulty())
                .kudosCount(saved.getKudosUserIds().size())
                .userReacted(saved.getKudosUserIds().contains(currentStudentId))
                .reactionCounts(counts)
                .myReactions(myReactions)
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public void recordActivity(
            Student student,
            FriendActivityType type,
            String title,
            String description,
            String link,
            Platform platform,
            String difficulty
    ) {
        if (student == null) return;
        FriendActivity activity = FriendActivity.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .studentHandle(student.getLeetcodeUsername() != null ? student.getLeetcodeUsername() : student.getCodeforcesHandle())
                .studentAvatarUrl(student.getAvatarUrl())
                .type(type)
                .title(title)
                .description(description)
                .link(link)
                .platform(platform)
                .difficulty(difficulty)
                .createdAt(Instant.now())
                .build();
        friendActivityRepository.save(activity);
    }

    // ==========================================
    // 5. FRIENDS LEADERBOARD
    // ==========================================

    public List<FriendsLeaderboardEntryDTO> getFriendsLeaderboard(String currentStudentId, String sortBy) {
        Student current = studentRepository.findById(currentStudentId)
                .orElseThrow(() -> new StudentNotFoundException("Current student not found"));

        List<String> targetIds = new ArrayList<>();
        targetIds.add(currentStudentId);
        if (current.getFriendIds() != null) {
            targetIds.addAll(current.getFriendIds());
        }

        List<Student> students = studentRepository.findAllById(targetIds);

        List<FriendsLeaderboardEntryDTO> entries = students.stream().map(s -> {
            int lcSolved = studentMapper.calculateLeetcodeSolved(s.getProblemStats());
            int cfSolved = s.getCodeforcesSolvedCount() != null ? s.getCodeforcesSolvedCount() : 0;
            int total = lcSolved + cfSolved;

            int wins = s.getPvpWins() != null ? s.getPvpWins() : 0;
            int losses = s.getPvpLosses() != null ? s.getPvpLosses() : 0;
            int totalPvp = wins + losses;
            double winRate = totalPvp > 0 ? (double) wins / totalPvp * 100 : 0.0;

            return FriendsLeaderboardEntryDTO.builder()
                    .studentId(s.getId())
                    .name(s.getName())
                    .leetcodeUsername(s.getLeetcodeUsername())
                    .codeforcesHandle(s.getCodeforcesHandle())
                    .avatarUrl(s.getAvatarUrl())
                    .totalSolved(total)
                    .leetcodeSolved(lcSolved)
                    .codeforcesSolved(cfSolved)
                    .currentContestRating(s.getCurrentContestRating())
                    .codeforcesRating(s.getCodeforcesRating())
                    .streak(s.getStreak() != null ? s.getStreak() : 0)
                    .pvpWins(wins)
                    .pvpLosses(losses)
                    .pvpWinRate(Math.round(winRate * 10.0) / 10.0)
                    .isCurrentUser(s.getId().equals(currentStudentId))
                    .build();
        }).collect(Collectors.toList());

        // Sort comparator
        String criterion = sortBy != null ? sortBy.toLowerCase() : "totalsolved";
        entries.sort((a, b) -> {
            switch (criterion) {
                case "rating":
                    return Double.compare(b.getCurrentContestRating(), a.getCurrentContestRating());
                case "streak":
                    return Integer.compare(b.getStreak(), a.getStreak());
                case "pvp":
                    int cmp = Integer.compare(b.getPvpWins(), a.getPvpWins());
                    if (cmp != 0) return cmp;
                    return Double.compare(b.getPvpWinRate(), a.getPvpWinRate());
                case "totalsolved":
                default:
                    return Integer.compare(b.getTotalSolved(), a.getTotalSolved());
            }
        });

        // Assign rank numbers
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    // ==========================================
    // 6. PEER-TO-PEER STUDY HUB & NOTES
    // ==========================================

    public List<PeerStudyPostDTO> getPeerStudyPosts(String currentStudentId, String topic) {
        PageRequest page = PageRequest.of(0, 30);
        List<PeerStudyPost> posts;
        if (topic != null && !topic.isBlank() && !"all".equalsIgnoreCase(topic)) {
            posts = peerStudyPostRepository.findByTopicIgnoreCaseOrderByCreatedAtDesc(topic, page);
        } else {
            posts = peerStudyPostRepository.findAllByOrderByCreatedAtDesc(page);
        }

        return posts.stream().map(p -> toPeerStudyPostDTO(p, currentStudentId)).collect(Collectors.toList());
    }

    public PeerStudyPostDTO createPeerStudyPost(String currentStudentId, CreatePeerStudyPostRequest request) {
        Student student = studentRepository.findById(currentStudentId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found"));

        PeerStudyPost post = PeerStudyPost.builder()
                .authorId(student.getId())
                .authorName(student.getName())
                .authorHandle(student.getLeetcodeUsername() != null ? student.getLeetcodeUsername() : student.getCodeforcesHandle())
                .authorAvatarUrl(student.getAvatarUrl())
                .problemTitle(request.getProblemTitle())
                .problemSlug(request.getProblemSlug())
                .problemPlatform(request.getProblemPlatform() != null ? request.getProblemPlatform() : Platform.LEETCODE)
                .problemLink(request.getProblemLink())
                .topic(request.getTopic() != null ? request.getTopic() : "General")
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "Medium")
                .type(request.getType() != null ? request.getType() : PeerStudyPostType.STUDY_NOTE)
                .title(request.getTitle())
                .content(request.getContent())
                .approach(request.getApproach())
                .timeComplexity(request.getTimeComplexity())
                .spaceComplexity(request.getSpaceComplexity())
                .createdAt(Instant.now())
                .build();

        PeerStudyPost saved = peerStudyPostRepository.save(post);

        // Record activity
        recordActivity(
                student,
                FriendActivityType.PEER_NOTE,
                "Shared Peer Study Insight",
                student.getName() + " shared a " + post.getType().name().replace('_', ' ').toLowerCase() + " on '" + post.getProblemTitle() + "'",
                post.getProblemLink(),
                post.getProblemPlatform(),
                post.getDifficulty()
        );

        return toPeerStudyPostDTO(saved, currentStudentId);
    }

    public PeerStudyPostDTO addPeerStudyReply(String currentStudentId, String postId, AddPeerStudyReplyRequest request) {
        PeerStudyPost post = peerStudyPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Student student = studentRepository.findById(currentStudentId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found"));

        if (post.getReplies() == null) {
            post.setReplies(new ArrayList<>());
        }

        PeerStudyReply reply = PeerStudyReply.builder()
                .id(UUID.randomUUID().toString())
                .authorId(student.getId())
                .authorName(student.getName())
                .authorHandle(student.getLeetcodeUsername() != null ? student.getLeetcodeUsername() : student.getCodeforcesHandle())
                .authorAvatarUrl(student.getAvatarUrl())
                .content(request.getContent())
                .createdAt(Instant.now())
                .build();

        post.getReplies().add(reply);
        PeerStudyPost saved = peerStudyPostRepository.save(post);
        return toPeerStudyPostDTO(saved, currentStudentId);
    }

    public PeerStudyPostDTO toggleLikePeerPost(String currentStudentId, String postId) {
        PeerStudyPost post = peerStudyPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getLikes() == null) {
            post.setLikes(new HashSet<>());
        }

        if (post.getLikes().contains(currentStudentId)) {
            post.getLikes().remove(currentStudentId);
        } else {
            post.getLikes().add(currentStudentId);
        }

        PeerStudyPost saved = peerStudyPostRepository.save(post);
        return toPeerStudyPostDTO(saved, currentStudentId);
    }

    public List<CuratedProblemDTO> getCuratedProblems(String topic) {
        if (topic != null && !topic.isBlank() && !"all".equalsIgnoreCase(topic)) {
            return curatedTopicCatalog.getCuratedProblemsForTopic(topic);
        }
        return curatedTopicCatalog.getAllCuratedProblems();
    }

    private PeerStudyPostDTO toPeerStudyPostDTO(PeerStudyPost p, String currentStudentId) {
        List<PeerStudyReplyDTO> replies = p.getReplies() != null ? p.getReplies().stream().map(r -> PeerStudyReplyDTO.builder()
                .id(r.getId())
                .authorId(r.getAuthorId())
                .authorName(r.getAuthorName())
                .authorHandle(r.getAuthorHandle())
                .authorAvatarUrl(r.getAuthorAvatarUrl())
                .content(r.getContent())
                .createdAt(r.getCreatedAt())
                .build()).collect(Collectors.toList()) : Collections.emptyList();

        int likeCount = p.getLikes() != null ? p.getLikes().size() : 0;
        boolean userLiked = p.getLikes() != null && p.getLikes().contains(currentStudentId);

        return PeerStudyPostDTO.builder()
                .id(p.getId())
                .authorId(p.getAuthorId())
                .authorName(p.getAuthorName())
                .authorHandle(p.getAuthorHandle())
                .authorAvatarUrl(p.getAuthorAvatarUrl())
                .problemTitle(p.getProblemTitle())
                .problemSlug(p.getProblemSlug())
                .problemPlatform(p.getProblemPlatform())
                .problemLink(p.getProblemLink())
                .topic(p.getTopic())
                .difficulty(p.getDifficulty())
                .type(p.getType())
                .title(p.getTitle())
                .content(p.getContent())
                .approach(p.getApproach())
                .timeComplexity(p.getTimeComplexity())
                .spaceComplexity(p.getSpaceComplexity())
                .replies(replies)
                .likeCount(likeCount)
                .userLiked(userLiked)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
