package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.StudentNotFoundException;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private LeetCodeApiClient leetCodeApiClient;

    @Mock
    private CodeforcesApiClient codeforcesApiClient;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private RedisDistributedLockService lockService;

    @Mock
    private RedisLeaderboardService leaderboardService;

    @Mock
    private org.springframework.cache.CacheManager cacheManager;

    @Mock
    private com.tracker.leetcode.tracker.Mapper.StudentMapper studentMapper;

    @Mock
    private RedisWebSocketBridge webSocketBridge;

    @InjectMocks
    private StudentService studentService;

    private Student mockStudent;

    @BeforeEach
    void setUp() {
        mockStudent = new Student();
        mockStudent.setId("123");
        mockStudent.setName("Test Student");
        mockStudent.setLeetcodeUsername("test_user");

        lenient().when(lockService.executeWithLock(anyString(), any(), any()))
                .thenAnswer(invocation -> {
                    java.util.function.Supplier<?> task = invocation.getArgument(2);
                    return Optional.ofNullable(task.get());
                });
    }

    @Test
    void syncAllProfileData_WhenStudentExists_ShouldReturnUpdatedStudent() {
        when(studentRepository.findByLeetcodeUsername("test_user")).thenReturn(Optional.of(mockStudent));
        when(leetCodeApiClient.fetchExtendedProfileDetails(anyString())).thenReturn(new Student());
        when(studentRepository.save(any(Student.class))).thenReturn(mockStudent);

        Student result = studentService.syncAllProfileData("test_user");

        assertNotNull(result);
        assertEquals("test_user", result.getLeetcodeUsername());
        verify(leetCodeApiClient, times(1)).fetchCalendarData("test_user");
        verify(leetCodeApiClient, times(1)).fetchProblemStats("test_user");
        verify(studentRepository, times(1)).save(mockStudent);
    }

    @Test
    void syncAllProfileData_WhenStudentDoesNotExist_ShouldThrowException() {
        when(studentRepository.findByLeetcodeUsername("unknown_user")).thenReturn(Optional.empty());

        Exception exception = assertThrows(StudentNotFoundException.class, () -> studentService.syncAllProfileData("unknown_user"));

        assertTrue(exception.getMessage().contains("not found in database"));
        verify(leetCodeApiClient, never()).fetchCalendarData(anyString());
    }

    @Test
    void updateStudentHandles_LinkingCodeforces_ShouldSucceed() {
        when(studentRepository.findById("123")).thenReturn(Optional.of(mockStudent));
        when(studentRepository.findByCodeforcesHandle("new_cf")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        Student updated = studentService.updateStudentHandles("123", "test_user", "new_cf");

        assertNotNull(updated);
        assertEquals("test_user", updated.getLeetcodeUsername());
        assertEquals("new_cf", updated.getCodeforcesHandle());
        verify(studentRepository, times(2)).save(mockStudent);
    }

    @Test
    void updateStudentHandles_WhenBothBlank_ShouldThrowIllegalArgumentException() {
        when(studentRepository.findById("123")).thenReturn(Optional.of(mockStudent));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> studentService.updateStudentHandles("123", "  ", "")
        );

        assertTrue(ex.getMessage().contains("At least one platform username"));
        verify(studentRepository, never()).save(mockStudent);
    }
}