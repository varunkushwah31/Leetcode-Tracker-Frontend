package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.LearningPathNotFoundException;
import com.tracker.leetcode.tracker.Models.LearningPath;
import com.tracker.leetcode.tracker.Models.Platform;
import com.tracker.leetcode.tracker.Repository.LearningPathRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningPathServiceTest {

    @Mock
    private LearningPathRepository pathRepository;

    @Mock
    private ClassroomService classroomService;

    @InjectMocks
    private LearningPathService learningPathService;

    private LearningPath mockPath;

    @BeforeEach
    void setUp() {
        mockPath = new LearningPath();
        mockPath.setId("path-1");
        mockPath.setMentorId("mentor-123");
        mockPath.setTitle("DSA Master Roadmap");
        mockPath.setDescription("Essential problems");

        List<LearningPath.PathQuestion> questions = new ArrayList<>();
        questions.add(new LearningPath.PathQuestion(Platform.LEETCODE, "Two Sum", "two-sum", 3));
        questions.add(new LearningPath.PathQuestion(Platform.CODEFORCES, "Watermelon", "4A", 5));
        // Also test default platform when null
        questions.add(new LearningPath.PathQuestion(null, null, "3sum", 2));
        mockPath.setQuestions(questions);
    }

    @Test
    void testCreatePath() {
        when(pathRepository.save(any(LearningPath.class))).thenReturn(mockPath);

        LearningPath created = learningPathService.createPath(mockPath);

        assertNotNull(created);
        assertEquals("DSA Master Roadmap", created.getTitle());
        verify(pathRepository, times(1)).save(mockPath);
    }

    @Test
    void testGetPathsByMentor() {
        when(pathRepository.findByMentorId("mentor-123")).thenReturn(List.of(mockPath));

        List<LearningPath> paths = learningPathService.getPathsByMentor("mentor-123");

        assertEquals(1, paths.size());
        assertEquals("DSA Master Roadmap", paths.get(0).getTitle());
    }

    @Test
    void testAssignPathToClassroom_SuccessWithMultiPlatform() {
        when(pathRepository.findById("path-1")).thenReturn(Optional.of(mockPath));

        learningPathService.assignPathToClassroom("path-1", "class-456");

        // Verify LeetCode question
        verify(classroomService, times(1)).assignQuestion(
                eq("class-456"),
                eq(Platform.LEETCODE),
                eq("Two Sum"),
                eq("two-sum"),
                anyLong(),
                anyLong()
        );

        // Verify Codeforces question
        verify(classroomService, times(1)).assignQuestion(
                eq("class-456"),
                eq(Platform.CODEFORCES),
                eq("Watermelon"),
                eq("4A"),
                anyLong(),
                anyLong()
        );

        // Verify null platform defaults to LEETCODE
        verify(classroomService, times(1)).assignQuestion(
                eq("class-456"),
                eq(Platform.LEETCODE),
                isNull(),
                eq("3sum"),
                anyLong(),
                anyLong()
        );
    }

    @Test
    void testAssignPathToClassroom_NotFound() {
        when(pathRepository.findById("invalid-path")).thenReturn(Optional.empty());

        assertThrows(LearningPathNotFoundException.class, () ->
                learningPathService.assignPathToClassroom("invalid-path", "class-456")
        );
    }

    @Test
    void testAssignPathToClassroom_EmptyQuestions() {
        mockPath.setQuestions(new ArrayList<>());
        when(pathRepository.findById("path-1")).thenReturn(Optional.of(mockPath));

        learningPathService.assignPathToClassroom("path-1", "class-456");

        verifyNoInteractions(classroomService);
    }
}
