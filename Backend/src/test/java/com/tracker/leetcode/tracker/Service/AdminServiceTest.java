package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.MentorDTO;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.DTO.StudentSummaryDTO;
import com.tracker.leetcode.tracker.Mapper.StudentMapper;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisServerCommands;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private MentorService mentorService;

    @Mock
    private ClassroomService classroomService;

    @Mock
    private StudentService studentService;

    @Mock
    private StudentMapper studentMapper;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private RedisConnectionFactory redisConnectionFactory;

    @Mock
    private RedisConnection redisConnection;

    @Mock
    private RedisServerCommands redisServerCommands;

    @Mock
    private Cache mockCache;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                studentRepository,
                mentorRepository,
                classroomRepository,
                mentorService,
                classroomService,
                studentService,
                studentMapper,
                cacheManager,
                stringRedisTemplate,
                redisConnectionFactory
        );
    }

    @Test
    void getCacheStats_WhenRedisConnected_ShouldReturnStatsMap() {
        when(redisConnectionFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.serverCommands()).thenReturn(redisServerCommands);

        Properties memoryProps = new Properties();
        memoryProps.setProperty("used_memory_human", "2.5M");
        memoryProps.setProperty("used_memory_peak_human", "5.0M");
        when(redisServerCommands.info("memory")).thenReturn(memoryProps);

        Properties serverProps = new Properties();
        serverProps.setProperty("redis_version", "7.0.0");
        serverProps.setProperty("uptime_in_seconds", "3600");
        when(redisServerCommands.info("server")).thenReturn(serverProps);

        when(cacheManager.getCacheNames()).thenReturn(List.of("classroom-dashboard", "student-stats"));
        when(stringRedisTemplate.keys(anyString())).thenReturn(Set.of("key1", "key2"));

        Map<String, Object> stats = adminService.getCacheStats();

        assertNotNull(stats);
        assertEquals("CONNECTED", stats.get("redisStatus"));
        assertEquals("2.5M", stats.get("usedMemoryHuman"));
        assertEquals("7.0.0", stats.get("redisVersion"));
        assertTrue(stats.containsKey("configuredCaches"));
        assertTrue(stats.containsKey("namespaceKeyCounts"));
    }

    @Test
    void clearCache_WhenAll_ShouldClearAllRegisteredCaches() {
        when(cacheManager.getCacheNames()).thenReturn(List.of("cache-1", "cache-2"));
        when(cacheManager.getCache("cache-1")).thenReturn(mockCache);
        when(cacheManager.getCache("cache-2")).thenReturn(mockCache);

        Map<String, String> response = adminService.clearCache("all");

        assertEquals("All caches successfully cleared.", response.get("message"));
        verify(mockCache, times(2)).clear();
    }

    @Test
    void clearCache_WhenSpecificCacheExists_ShouldClearIt() {
        when(cacheManager.getCache("cache-1")).thenReturn(mockCache);

        Map<String, String> response = adminService.clearCache("cache-1");

        assertEquals("Cache 'cache-1' successfully cleared.", response.get("message"));
        verify(mockCache, times(1)).clear();
    }

    @Test
    void clearCache_WhenCacheNotFound_ShouldReturnError() {
        when(cacheManager.getCache("non-existent")).thenReturn(null);

        Map<String, String> response = adminService.clearCache("non-existent");

        assertTrue(response.containsKey("error"));
        assertEquals("Cache 'non-existent' not found.", response.get("error"));
    }

    @Test
    void getAllStudents_ShouldReturnMappedStudents() {
        Student s = new Student();
        s.setId("s1");
        s.setName("Student One");

        StudentSummaryDTO dto = StudentSummaryDTO.builder().id("s1").name("Student One").build();

        when(studentRepository.findAll()).thenReturn(List.of(s));
        when(studentMapper.toSummaryDTO(s)).thenReturn(dto);

        List<StudentSummaryDTO> result = adminService.getAllStudents();

        assertEquals(1, result.size());
        assertEquals("s1", result.get(0).getId());
    }

    @Test
    void deleteStudent_WhenExists_ShouldDeleteAndRemoveFromClassrooms() {
        Student s = new Student();
        s.setId("s1");
        s.setEmail("s1@example.com");

        Classroom c = new Classroom();
        c.setId("c1");
        c.setStudentIds(new ArrayList<>(List.of("s1", "s2")));

        when(studentRepository.findById("s1")).thenReturn(Optional.of(s));
        when(classroomRepository.findAll()).thenReturn(List.of(c));

        adminService.deleteStudent("s1");

        assertFalse(c.getStudentIds().contains("s1"));
        verify(classroomRepository).save(c);
        verify(studentRepository).delete(s);
    }

    @Test
    void syncStudent_WhenExists_ShouldCallSync() {
        Student s = new Student();
        s.setId("s1");
        s.setName("Alice");
        s.setLeetcodeUsername("alice_lc");

        when(studentRepository.findById("s1")).thenReturn(Optional.of(s));

        Map<String, String> res = adminService.syncStudent("s1");

        assertTrue(res.get("message").contains("Alice"));
        verify(studentService).syncAllProfileData("alice_lc");
    }

    @Test
    void createMentor_ShouldCallMentorService() {
        RegisterRequest req = new RegisterRequest("Mentor Bob", "bob@example.com", "pass123");
        MentorDTO expected = MentorDTO.builder().id("m1").name("Mentor Bob").email("bob@example.com").role(Role.MENTOR).build();

        when(mentorService.createMentor(any(Mentor.class))).thenReturn(expected);

        MentorDTO result = adminService.createMentor(req);

        assertNotNull(result);
        assertEquals("Mentor Bob", result.getName());
        assertEquals(Role.MENTOR, result.getRole());
    }
}

