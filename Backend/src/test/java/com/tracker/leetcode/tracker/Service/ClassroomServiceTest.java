package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.ClassroomDashboardDTO;
import com.tracker.leetcode.tracker.Exception.AssignmentNotFoundException;
import com.tracker.leetcode.tracker.Exception.ClassroomNotFoundException;
import com.tracker.leetcode.tracker.Mapper.StudentMapper;
import com.tracker.leetcode.tracker.Models.Assignment;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.tracker.leetcode.tracker.DTO.BulkImportResponseDTO;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClassroomServiceTest {

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private StudentMapper studentMapper;

    @Mock
    private LeetCodeApiClient leetCodeApiClient;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private RedisLeaderboardService redisLeaderboardService;

    @Mock
    private RedisWebSocketBridge webSocketBridge;

    @InjectMocks
    private ClassroomService classroomService;

    private Classroom mockClassroom;
    private Assignment mockAssignment;

    @BeforeEach
    void setUp() {
        mockClassroom = new Classroom();
        mockClassroom.setId("class-1");
        mockClassroom.setClassName("Algorithms");
        mockClassroom.setMentorId("mentor-123");

        mockAssignment = new Assignment();
        mockAssignment.setId("assign-1");
        mockAssignment.setTitleSlug("two-sum");
        mockAssignment.setQuestionLink("https://leetcode.com/problems/two-sum/");
        mockAssignment.setStartTimestamp(1000L);
        mockAssignment.setEndTimestamp(2000L);

        List<Assignment> assignments = new ArrayList<>();
        assignments.add(mockAssignment);
        mockClassroom.setAssignments(assignments);
    }

    @Test
    void deleteAssignment_WhenAuthorized_ShouldRemoveAssignmentAndBroadcast() {
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));
        when(classroomRepository.save(any(Classroom.class))).thenReturn(mockClassroom);

        classroomService.deleteAssignment("class-1", "assign-1", "mentor-123");

        assertTrue(mockClassroom.getAssignments().isEmpty());
        verify(classroomRepository, times(1)).save(mockClassroom);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/classrooms/class-1"), (Object) any());
        verify(webSocketBridge, times(1)).broadcastClassroomUpdate(eq("class-1"), eq("UPDATE"), eq("Assignment deleted!"));
    }

    @Test
    void deleteAssignment_WhenNotMentor_ShouldThrowAccessDenied() {
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));

        assertThrows(AccessDeniedException.class, () ->
                classroomService.deleteAssignment("class-1", "assign-1", "other-mentor")
        );

        verify(classroomRepository, never()).save(any());
    }

    @Test
    void deleteAssignment_WhenClassroomNotFound_ShouldThrowClassroomNotFoundException() {
        when(classroomRepository.findById("unknown-class")).thenReturn(Optional.empty());

        assertThrows(ClassroomNotFoundException.class, () ->
                classroomService.deleteAssignment("unknown-class", "assign-1", "mentor-123")
        );
    }

    @Test
    void deleteAssignment_WhenAssignmentNotFound_ShouldThrowAssignmentNotFoundException() {
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));

        assertThrows(AssignmentNotFoundException.class, () ->
                classroomService.deleteAssignment("class-1", "non-existent-assign", "mentor-123")
        );
    }

    @Test
    void generateStudentTemplateCsv_ShouldReturnValidCsvTemplate() {
        String template = classroomService.generateStudentTemplateCsv();
        assertNotNull(template);
        assertTrue(template.contains("Name,Email,LeetCode Username,Codeforces Handle"));
    }

    @Test
    void generateClassroomAssignmentMatrixCsv_ShouldGenerateMatrix() {
        mockClassroom.setStudentIds(new ArrayList<>(List.of("std-1")));
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));

        Student student = new Student();
        student.setId("std-1");
        student.setName("Alice");
        student.setEmail("alice@test.com");
        student.setLeetcodeUsername("alice_lc");
        student.setManuallyCompletedAssignments(new ArrayList<>(List.of("assign-1")));
        when(studentRepository.findAllById(any())).thenReturn(List.of(student));

        String matrix = classroomService.generateClassroomAssignmentMatrixCsv("class-1");
        assertNotNull(matrix);
        assertTrue(matrix.contains("Alice"));
        assertTrue(matrix.contains("COMPLETED"));
    }

    @Test
    void extractLeetcodeUsername_ShouldExtractHandleCorrectly() {
        assertEquals("varunkushwah31", ClassroomService.extractLeetcodeUsername("https://leetcode.com/u/varunkushwah31/"));
        assertEquals("varunkushwah31", ClassroomService.extractLeetcodeUsername("https://leetcode.com/varunkushwah31"));
        assertEquals("varunkushwah31", ClassroomService.extractLeetcodeUsername("https://leetcode.cn/u/varunkushwah31/?ref=test#overview"));
        assertEquals("varunkushwah31", ClassroomService.extractLeetcodeUsername("leetcode.com/u/varunkushwah31"));
        assertEquals("tourist", ClassroomService.extractLeetcodeUsername("@tourist"));
        assertEquals("tourist", ClassroomService.extractLeetcodeUsername("tourist"));
        assertEquals("", ClassroomService.extractLeetcodeUsername("https://leetcode.com/problems/two-sum/"));
        assertEquals("", ClassroomService.extractLeetcodeUsername(""));
        assertEquals("", ClassroomService.extractLeetcodeUsername(null));
    }

    @Test
    void extractCodeforcesHandle_ShouldExtractHandleCorrectly() {
        assertEquals("tourist", ClassroomService.extractCodeforcesHandle("https://codeforces.com/profile/tourist/"));
        assertEquals("tourist", ClassroomService.extractCodeforcesHandle("https://codeforces.net/profile/tourist?mobile=true#history"));
        assertEquals("tourist", ClassroomService.extractCodeforcesHandle("codeforces.com/profile/tourist"));
        assertEquals("tourist", ClassroomService.extractCodeforcesHandle("@tourist"));
        assertEquals("tourist", ClassroomService.extractCodeforcesHandle("tourist"));
        assertEquals("", ClassroomService.extractCodeforcesHandle("https://codeforces.com/problemset/problem/1/A"));
        assertEquals("", ClassroomService.extractCodeforcesHandle(""));
        assertEquals("", ClassroomService.extractCodeforcesHandle(null));
    }

    @Test
    void isUrlMethods_ShouldIdentifyPlatformUrls() {
        assertTrue(ClassroomService.isLeetCodeUrl("https://leetcode.com/u/test/"));
        assertTrue(ClassroomService.isLeetCodeUrl("leetcode.cn/u/test"));
        assertFalse(ClassroomService.isLeetCodeUrl("https://codeforces.com/profile/test"));
        assertFalse(ClassroomService.isLeetCodeUrl("test_user"));

        assertTrue(ClassroomService.isCodeforcesUrl("https://codeforces.com/profile/test/"));
        assertTrue(ClassroomService.isCodeforcesUrl("codeforces.net/profile/test"));
        assertFalse(ClassroomService.isCodeforcesUrl("https://leetcode.com/u/test"));
        assertFalse(ClassroomService.isCodeforcesUrl("test_user"));
    }

    @Test
    void addStudentToClassroom_WhenLeetCodeUrlProvided_ShouldExtractUsernameAndProvision() {
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));
        when(studentRepository.findByLeetcodeUsername("john_doe")).thenReturn(Optional.empty());
        when(studentRepository.findById("john_doe")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student s = invocation.getArgument(0);
            s.setId("std-new-1");
            return s;
        });
        when(classroomRepository.save(any(Classroom.class))).thenReturn(mockClassroom);

        Classroom updated = classroomService.addStudentToClassroom("class-1", "https://leetcode.com/u/john_doe/?ref=123");

        assertNotNull(updated);
        assertTrue(mockClassroom.getStudentIds().contains("std-new-1"));
        verify(studentRepository).save(argThat(s ->
            "john_doe".equals(s.getLeetcodeUsername()) && "john_doe".equals(s.getName())
        ));
    }

    @Test
    void addStudentToClassroom_WhenCodeforcesUrlProvided_ShouldExtractHandleAndProvision() {
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));
        when(studentRepository.findByCodeforcesHandle("tourist")).thenReturn(Optional.empty());
        when(studentRepository.findById("tourist")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student s = invocation.getArgument(0);
            s.setId("std-new-2");
            return s;
        });
        when(classroomRepository.save(any(Classroom.class))).thenReturn(mockClassroom);

        Classroom updated = classroomService.addStudentToClassroom("class-1", "https://codeforces.com/profile/tourist");

        assertNotNull(updated);
        assertTrue(mockClassroom.getStudentIds().contains("std-new-2"));
        verify(studentRepository).save(argThat(s ->
            "tourist".equals(s.getCodeforcesHandle()) && "tourist".equals(s.getName())
        ));
    }

    @Test
    void bulkAddStudents_WithUrlsAndSwappedColumns_ShouldAutoExtractAndRoute() {
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));
        when(classroomRepository.save(any(Classroom.class))).thenReturn(mockClassroom);

        String csvContent = "Name,Email,LeetCode Username,Codeforces Handle\n" +
                "Alice,alice@test.com,https://leetcode.com/u/alice_lc/?ref=1,https://codeforces.com/profile/alice_cf\n" +
                "Bob,bob@test.com,https://codeforces.com/profile/bob_cf,https://leetcode.com/u/bob_lc\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "students.csv",
                "text/csv",
                csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        when(studentRepository.findByEmail("alice@test.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("alice_lc")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("alice_cf")).thenReturn(Optional.empty());

        when(studentRepository.findByEmail("bob@test.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("bob_lc")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("bob_cf")).thenReturn(Optional.empty());

        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student s = invocation.getArgument(0);
            if (s.getId() == null) s.setId("id-" + s.getName());
            return s;
        });

        BulkImportResponseDTO res = classroomService.bulkAddStudents("class-1", file);

        assertEquals(2, res.getAddedCount());
        assertEquals(0, res.getFailedCount());

        verify(studentRepository).save(argThat(s ->
            "Alice".equals(s.getName()) &&
            "alice_lc".equals(s.getLeetcodeUsername()) &&
            "alice_cf".equals(s.getCodeforcesHandle())
        ));

        verify(studentRepository).save(argThat(s ->
            "Bob".equals(s.getName()) &&
            "bob_lc".equals(s.getLeetcodeUsername()) &&
            "bob_cf".equals(s.getCodeforcesHandle())
        ));
    }

    @Test
    void removeStudentFromClassroom_WhenAuthorized_ShouldRemoveStudentAndBroadcast() {
        mockClassroom.setStudentIds(new ArrayList<>(List.of("std-1", "std-2")));
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));
        when(classroomRepository.save(any(Classroom.class))).thenReturn(mockClassroom);

        Student student = new Student();
        student.setId("std-1");
        student.setName("Alice");
        when(studentRepository.findById("std-1")).thenReturn(Optional.of(student));

        Classroom result = classroomService.removeStudentFromClassroom("class-1", "std-1", "mentor-123");

        assertNotNull(result);
        assertFalse(mockClassroom.getStudentIds().contains("std-1"));
        assertTrue(mockClassroom.getStudentIds().contains("std-2"));
        verify(redisLeaderboardService).removeStudentFromClassroom("class-1", "std-1");
        verify(webSocketBridge).broadcastClassroomUpdate(eq("class-1"), eq("UPDATE"), contains("Alice"));
        verify(messagingTemplate).convertAndSend(eq("/topic/classrooms/class-1"), (Object) any());
    }

    @Test
    void removeStudentFromClassroom_WhenNotMentor_ShouldThrowAccessDenied() {
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));

        assertThrows(AccessDeniedException.class, () ->
            classroomService.removeStudentFromClassroom("class-1", "std-1", "other-mentor")
        );
        verify(classroomRepository, never()).save(any());
    }

    @Test
    void removeStudentFromClassroom_WhenStudentNotEnrolled_ShouldThrowValidationFailed() {
        mockClassroom.setStudentIds(new ArrayList<>(List.of("std-2")));
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));
        when(studentRepository.findById("std-unknown")).thenReturn(Optional.empty());

        assertThrows(com.tracker.leetcode.tracker.Exception.ValidationFailedException.class, () ->
            classroomService.removeStudentFromClassroom("class-1", "std-unknown", "mentor-123")
        );
        verify(classroomRepository, never()).save(any());
    }

    @Test
    void removeStudentFromClassroom_WhenIdentifierIsProfileUrl_ShouldResolveAndRemove() {
        mockClassroom.setStudentIds(new ArrayList<>(List.of("std-1")));
        when(classroomRepository.findById("class-1")).thenReturn(Optional.of(mockClassroom));
        when(classroomRepository.save(any(Classroom.class))).thenReturn(mockClassroom);

        Student student = new Student();
        student.setId("std-1");
        student.setName("Alice");
        student.setLeetcodeUsername("alice_lc");

        when(studentRepository.findByLeetcodeUsername("alice_lc")).thenReturn(Optional.of(student));

        Classroom result = classroomService.removeStudentFromClassroom("class-1", "https://leetcode.com/u/alice_lc/", "mentor-123");

        assertNotNull(result);
        assertFalse(mockClassroom.getStudentIds().contains("std-1"));
        verify(redisLeaderboardService).removeStudentFromClassroom("class-1", "std-1");
    }
}
