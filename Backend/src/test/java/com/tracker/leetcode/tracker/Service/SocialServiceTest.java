package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.*;
import com.tracker.leetcode.tracker.Mapper.StudentMapper;
import com.tracker.leetcode.tracker.Models.*;
import com.tracker.leetcode.tracker.Repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private FriendshipRepository friendshipRepository;
    @Mock
    private PvpMatchRepository pvpMatchRepository;
    @Mock
    private FriendActivityRepository friendActivityRepository;
    @Mock
    private PeerStudyPostRepository peerStudyPostRepository;
    @Mock
    private StudentService studentService;
    @Mock
    private StudentMapper studentMapper;
    @Mock
    private CuratedTopicCatalog curatedTopicCatalog;

    @InjectMocks
    private SocialService socialService;

    private Student studentA;
    private Student studentB;

    @BeforeEach
    void setUp() {
        studentA = new Student("alice_lc", "Alice");
        studentA.setId("userA");
        studentA.setEmail("alice@test.com");
        studentA.setFriendIds(new ArrayList<>());

        studentB = new Student("bob_lc", "Bob");
        studentB.setId("userB");
        studentB.setEmail("bob@test.com");
        studentB.setFriendIds(new ArrayList<>());
    }

    @Test
    void testSendFriendRequest_Success() {
        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(studentRepository.findById("userB")).thenReturn(Optional.of(studentB));
        when(friendshipRepository.findBetween("userA", "userB")).thenReturn(Optional.empty());

        Friendship friendship = Friendship.builder()
                .id("f1")
                .requesterId("userA")
                .receiverId("userB")
                .status(FriendshipStatus.PENDING)
                .build();
        when(friendshipRepository.save(any(Friendship.class))).thenReturn(friendship);

        Friendship result = socialService.sendFriendRequest("userA", "userB");
        assertNotNull(result);
        assertEquals(FriendshipStatus.PENDING, result.getStatus());
        verify(friendshipRepository).save(any(Friendship.class));
    }

    @Test
    void testSendFriendRequest_ToSelf_Throws() {
        assertThrows(IllegalArgumentException.class, () -> socialService.sendFriendRequest("userA", "userA"));
    }

    @Test
    void testAcceptFriendRequest_Success() {
        Friendship pending = Friendship.builder()
                .id("f1")
                .requesterId("userA")
                .receiverId("userB")
                .status(FriendshipStatus.PENDING)
                .build();

        when(friendshipRepository.findById("f1")).thenReturn(Optional.of(pending));
        when(friendshipRepository.save(any(Friendship.class))).thenAnswer(i -> i.getArgument(0));
        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(studentRepository.findById("userB")).thenReturn(Optional.of(studentB));

        Friendship accepted = socialService.acceptFriendRequest("userB", "f1");
        assertEquals(FriendshipStatus.ACCEPTED, accepted.getStatus());
        assertTrue(studentA.getFriendIds().contains("userB"));
        assertTrue(studentB.getFriendIds().contains("userA"));
        verify(studentRepository, times(2)).save(any(Student.class));
        verify(friendActivityRepository).save(any(FriendActivity.class));
    }

    @Test
    void testCreatePvpChallenge_Success() {
        studentA.getFriendIds().add("userB");
        studentB.getFriendIds().add("userA");

        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(studentRepository.findById("userB")).thenReturn(Optional.of(studentB));

        Friendship accepted = Friendship.builder()
                .id("f1")
                .requesterId("userA")
                .receiverId("userB")
                .status(FriendshipStatus.ACCEPTED)
                .build();
        when(friendshipRepository.findBetween("userA", "userB")).thenReturn(Optional.of(accepted));

        CuratedProblemDTO curated = CuratedProblemDTO.builder()
                .title("Two Sum")
                .titleSlug("two-sum")
                .difficulty("Easy")
                .platform("LEETCODE")
                .topic("Array")
                .link("https://leetcode.com/problems/two-sum/")
                .build();
        when(curatedTopicCatalog.getRandomOrTopicProblem(anyString(), anyString())).thenReturn(curated);

        when(pvpMatchRepository.save(any(PvpMatch.class))).thenAnswer(i -> {
            PvpMatch m = i.getArgument(0);
            m.setId("match123");
            return m;
        });

        CreatePvpMatchRequest req = CreatePvpMatchRequest.builder()
                .opponentId("userB")
                .problemTopic("Array")
                .problemDifficulty("Easy")
                .durationMinutes(30)
                .build();

        PvpMatchDTO duel = socialService.createPvpChallenge("userA", req);
        assertNotNull(duel);
        assertEquals("Two Sum", duel.getProblemTitle());
        assertEquals(PvpMatchStatus.INVITED, duel.getStatus());
        verify(friendActivityRepository).save(any(FriendActivity.class));
    }

    @Test
    void testVerifyPvpMatch_WinnerSolved() {
        PvpMatch match = PvpMatch.builder()
                .id("match1")
                .challengerId("userA")
                .challengerName("Alice")
                .opponentId("userB")
                .opponentName("Bob")
                .problemTitle("Two Sum")
                .problemSlug("two-sum")
                .durationMinutes(30)
                .status(PvpMatchStatus.IN_PROGRESS)
                .expiresAt(Instant.now().plusSeconds(1800))
                .build();

        when(pvpMatchRepository.findById("match1")).thenReturn(Optional.of(match));
        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(studentRepository.findById("userB")).thenReturn(Optional.of(studentB));

        RecentSubmission sub = new RecentSubmission("Two Sum", "two-sum", Instant.now().getEpochSecond());
        studentA.setRecentSubmissions(List.of(sub));

        when(pvpMatchRepository.save(any(PvpMatch.class))).thenAnswer(i -> i.getArgument(0));

        PvpMatchDTO result = socialService.verifyPvpMatch("userA", "match1", null);
        assertEquals(PvpMatchStatus.COMPLETED, result.getStatus());
        assertEquals("userA", result.getWinnerId());
        assertTrue(result.isChallengerSolved());
        assertEquals(1, studentA.getPvpWins());
        assertEquals(1, studentB.getPvpLosses());
    }

    @Test
    void testSendFriendRequest_SameEmail_Throws() {
        studentB.setEmail("alice@test.com"); // Same email as studentA
        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(studentRepository.findById("userB")).thenReturn(Optional.of(studentB));

        assertThrows(IllegalArgumentException.class, () -> socialService.sendFriendRequest("userA", "userB"));
    }

    @Test
    void testAcceptFriendRequest_SameRequesterAndReceiver_Throws() {
        Friendship selfFriendship = Friendship.builder()
                .id("fSelf")
                .requesterId("userA")
                .receiverId("userA")
                .status(FriendshipStatus.PENDING)
                .build();
        when(friendshipRepository.findById("fSelf")).thenReturn(Optional.of(selfFriendship));

        assertThrows(IllegalArgumentException.class, () -> socialService.acceptFriendRequest("userA", "fSelf"));
    }

    @Test
    void testCreatePvpChallenge_SelfDuel_Throws() {
        CreatePvpMatchRequest req = CreatePvpMatchRequest.builder()
                .opponentId("userA")
                .build();
        assertThrows(IllegalArgumentException.class, () -> socialService.createPvpChallenge("userA", req));
    }

    @Test
    void testGetFriendDashboard_SelfView_Throws() {
        assertThrows(IllegalArgumentException.class, () -> socialService.getFriendDashboard("userA", "userA"));
    }

    @Test
    void testSearchStudents_ExcludesSelfAndSameEmail() {
        Student userC = new Student("carol_lc", "Carol");
        userC.setId("userC");
        userC.setEmail("carol@test.com");

        Student userClone = new Student("alice2_lc", "Alice Clone");
        userClone.setId("userClone");
        userClone.setEmail("alice@test.com"); // Same email as Alice

        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(friendshipRepository.findAllByStudentId("userA")).thenReturn(Collections.emptyList());
        when(studentRepository.findAll()).thenReturn(List.of(studentA, studentB, userC, userClone));

        List<SocialSearchStudentDTO> results = socialService.searchStudents("userA", "Alice");
        // studentA is excluded by id, userClone is excluded by email matching studentA's email
        assertEquals(0, results.size());
    }

    @Test
    void testGetFriendsAndRequests_SanitizesAndExcludesSelf() {
        // Suppose studentA corruptedly has own id in friendIds
        studentA.getFriendIds().add("userA");
        studentA.getFriendIds().add("userB");

        Friendship selfF = Friendship.builder()
                .id("fSelf")
                .requesterId("userA")
                .receiverId("userA")
                .status(FriendshipStatus.ACCEPTED)
                .build();

        Friendship validF = Friendship.builder()
                .id("fValid")
                .requesterId("userA")
                .receiverId("userB")
                .status(FriendshipStatus.ACCEPTED)
                .build();

        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(studentRepository.findById("userB")).thenReturn(Optional.of(studentB));
        when(friendshipRepository.findAllByStudentId("userA")).thenReturn(List.of(selfF, validF));

        Map<String, Object> result = socialService.getFriendsAndRequests("userA");
        @SuppressWarnings("unchecked")
        List<FriendDTO> friends = (List<FriendDTO>) result.get("friends");

        assertEquals(1, friends.size());
        assertEquals("userB", friends.get(0).getId());
        assertFalse(studentA.getFriendIds().contains("userA"));
    }

    @Test
    void testFriendsLeaderboard_SortedByTotalSolved() {
        studentA.getFriendIds().add("userB");
        studentA.setStreak(5);
        studentB.setStreak(10);

        when(studentRepository.findById("userA")).thenReturn(Optional.of(studentA));
        when(studentRepository.findAllById(anyCollection())).thenReturn(List.of(studentA, studentB));

        studentA.setCodeforcesSolvedCount(100);
        studentB.setCodeforcesSolvedCount(200);

        List<FriendsLeaderboardEntryDTO> leaderboard = socialService.getFriendsLeaderboard("userA", "totalSolved");
        assertEquals(2, leaderboard.size());
        assertEquals("userB", leaderboard.get(0).getStudentId());
        assertEquals(1, leaderboard.get(0).getRank());
        assertEquals("userA", leaderboard.get(1).getStudentId());
        assertEquals(2, leaderboard.get(1).getRank());
        assertTrue(leaderboard.get(1).isCurrentUser());
    }
}
