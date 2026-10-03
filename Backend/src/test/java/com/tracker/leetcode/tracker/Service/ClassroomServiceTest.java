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
}
