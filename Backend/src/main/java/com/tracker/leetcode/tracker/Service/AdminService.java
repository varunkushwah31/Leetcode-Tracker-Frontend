package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.ClassroomDashboardDTO;
import com.tracker.leetcode.tracker.DTO.MentorDTO;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.DTO.StudentSummaryDTO;
import com.tracker.leetcode.tracker.DTO.SystemOverviewDTO;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Exception.ClassroomNotFoundException;
import com.tracker.leetcode.tracker.Exception.MentorNotFoundException;
import com.tracker.leetcode.tracker.Exception.StudentNotFoundException;
import com.tracker.leetcode.tracker.Mapper.StudentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final StudentRepository studentRepository;
    private final MentorRepository mentorRepository;
    private final ClassroomRepository classroomRepository;
    private final MentorService mentorService;
    private final ClassroomService classroomService;
    private final StudentService studentService;
    private final StudentMapper studentMapper;
    private final CacheManager cacheManager;
    private final StringRedisTemplate stringRedisTemplate;
    private final RedisConnectionFactory redisConnectionFactory;

    public SystemOverviewDTO getSystemOverview(){
        log.info("Super Admin requested the master system overview.");

        try {
            List<Student> allStudents = studentRepository.findAll();
            long totalStudents = allStudents.size();
            long totalMentors = mentorRepository.count();

            List<Classroom> classrooms = classroomRepository.findAll();
            long totalClassrooms = classrooms.size();

            long totalAssignments = classrooms.stream()
                    .mapToLong(c -> c.getAssignments() != null ? c.getAssignments().size() : 0)
                    .sum();

            long dual = allStudents.stream()
                    .filter(s -> s.getLeetcodeUsername() != null && !s.getLeetcodeUsername().isBlank() &&
                            s.getCodeforcesHandle() != null && !s.getCodeforcesHandle().isBlank())
                    .count();

            long lcOnly = allStudents.stream()
                    .filter(s -> (s.getLeetcodeUsername() != null && !s.getLeetcodeUsername().isBlank()) &&
                            (s.getCodeforcesHandle() == null || s.getCodeforcesHandle().isBlank()))
                    .count();

            long cfOnly = allStudents.stream()
                    .filter(s -> (s.getCodeforcesHandle() != null && !s.getCodeforcesHandle().isBlank()) &&
                            (s.getLeetcodeUsername() == null || s.getLeetcodeUsername().isBlank()))
                    .count();

            List<MentorDTO> mentorDTOS = mentorService.getAllMentors();
            List<ClassroomDashboardDTO> classroomDashboardDTOS = classrooms
                    .stream()
                    .map(classroom -> classroomService.getClassroomDashboard(classroom.getId(), "name"))
                    .toList();

            return SystemOverviewDTO
                    .builder()
                    .totalStudents(totalStudents)
                    .totalMentors(totalMentors)
                    .totalClassrooms(totalClassrooms)
                    .totalAssignments(totalAssignments)
                    .dualPlatformStudents(dual)
                    .leetcodeOnlyStudents(lcOnly)
                    .codeforcesOnlyStudents(cfOnly)
                    .allMentors(mentorDTOS)
                    .allClassrooms(classroomDashboardDTOS)
                    .build();
        } catch (Exception e) {
            log.error("Failed to generate system overview: {}", e.getMessage());
            throw new RuntimeException("Failed to generate system overview. Please try again later.");
        }
    }

    public List<StudentSummaryDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(studentMapper::toSummaryDTO)
                .toList();
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics", "student-stats", "student-progress", "student-recent"}, allEntries = true)
    public void deleteStudent(String studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found with ID: " + studentId));

        // Remove student reference from any enrolled classrooms
        List<Classroom> classrooms = classroomRepository.findAll();
        for (Classroom classroom : classrooms) {
            if (classroom.getStudentIds() != null && classroom.getStudentIds().remove(student.getId())) {
                classroomRepository.save(classroom);
            }
        }

        studentRepository.delete(student);
        log.info("SUPER ADMIN ACTION: Deleted student {} (ID: {})", student.getEmail(), student.getId());
    }

    public Map<String, String> syncStudent(String studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found with ID: " + studentId));

        String identifier = student.getLeetcodeUsername();
        if (identifier == null || identifier.isBlank()) {
            identifier = student.getCodeforcesHandle();
        }
        if (identifier == null || identifier.isBlank()) {
            identifier = student.getId();
        }

        studentService.syncAllProfileData(identifier);
        log.info("SUPER ADMIN ACTION: Synced profile for student: {} ({})", student.getName(), identifier);
        return Map.of("message", "Profile synced successfully for " + student.getName() + ".");
    }

    public MentorDTO createMentor(RegisterRequest request) {
        Mentor mentor = Mentor.builder()
                .name(request.name())
                .email(request.email())
                .password(request.password())
                .role(Role.MENTOR)
                .build();
        return mentorService.createMentor(mentor);
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics", "mentors-all", "mentor"}, allEntries = true)
    public void deleteMentor(String mentorId) {
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));

        // Cascade Delete: Wipe out all classrooms owned by this mentor
        if (mentor.getClassroomIds() != null && !mentor.getClassroomIds().isEmpty()) {
            classroomRepository.deleteAllById(mentor.getClassroomIds());
        }

        mentorRepository.delete(mentor);
        log.info("SUPER ADMIN ACTION: Deleted mentor {}", mentor.getEmail());
    }

    @CacheEvict(value = {"classroom-dashboard", "classroom-analytics", "mentors-all", "mentor"}, allEntries = true)
    public void deleteClassroom(String classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ClassroomNotFoundException("Classroom not found with ID: " + classroomId));

        // Remove the classroom reference from the Mentor's profile
        mentorRepository.findById(classroom.getMentorId()).ifPresent(mentor -> {
            mentor.getClassroomIds().remove(classroomId);
            mentorRepository.save(mentor);
        });

        classroomRepository.delete(classroom);
        log.info("SUPER ADMIN ACTION: Deleted classroom {}", classroom.getClassName());
    }

    public Map<String, String> forceGlobalSync() {
        List<Student> allStudents = studentRepository.findAll();
        int successCount = 0;

        for (Student student : allStudents) {
            try {
                // Use the best available identifier — supports LC-only, CF-only, and dual-platform students
                String identifier = student.getLeetcodeUsername();
                if (identifier == null || identifier.isBlank()) {
                    identifier = student.getCodeforcesHandle();
                }
                if (identifier == null || identifier.isBlank()) {
                    identifier = student.getId();
                }
                studentService.syncAllProfileData(identifier);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to sync student: {} (ID: {})", student.getName(), student.getId(), e);
            }
        }

        log.info("SUPER ADMIN ACTION: Forced global sync completed.");
        return Map.of("message", "Successfully synced " + successCount + " out of " + allStudents.size() + " students.");
    }

    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // 1. Connection & Server Info
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            stats.put("redisStatus", "CONNECTED");
            Properties memoryInfo = connection.serverCommands().info("memory");
            if (memoryInfo != null) {
                stats.put("usedMemoryHuman", memoryInfo.getProperty("used_memory_human", "N/A"));
                stats.put("usedMemoryPeakHuman", memoryInfo.getProperty("used_memory_peak_human", "N/A"));
            }
            Properties serverInfo = connection.serverCommands().info("server");
            if (serverInfo != null) {
                stats.put("redisVersion", serverInfo.getProperty("redis_version", "N/A"));
                stats.put("uptimeInSeconds", serverInfo.getProperty("uptime_in_seconds", "N/A"));
            }
        } catch (Exception ex) {
            stats.put("redisStatus", "DISCONNECTED: " + ex.getMessage());
        }

        // 2. Spring Cache Names
        Collection<String> cacheNames = cacheManager.getCacheNames();
        stats.put("configuredCaches", cacheNames);

        // 3. Key Count Estimations by Namespace
        Map<String, Long> keyCounts = new LinkedHashMap<>();
        List<String> prefixes = List.of(
                "student-progress*", "student-stats*", "student-recent*", "student-profile*",
                "classroom-dashboard*", "classroom-analytics*", "mentor*", "mentors-all*",
                "learning-paths-by-mentor*", "blacklist:jwt:*", "blacklist:user:*",
                "lock:*", "ratelimit:*", "leaderboard:*"
        );

        for (String prefix : prefixes) {
            try {
                Set<String> keys = stringRedisTemplate.keys(prefix);
                keyCounts.put(prefix, keys != null ? (long) keys.size() : 0L);
            } catch (Exception ex) {
                keyCounts.put(prefix, -1L);
            }
        }
        stats.put("namespaceKeyCounts", keyCounts);

        return stats;
    }

    public Map<String, String> clearCache(String cacheName) {
        if (cacheName == null || cacheName.isBlank() || "all".equalsIgnoreCase(cacheName)) {
            for (String name : cacheManager.getCacheNames()) {
                Cache cache = cacheManager.getCache(name);
                if (cache != null) {
                    cache.clear();
                }
            }
            log.info("SUPER ADMIN ACTION: Cleared ALL Spring Redis caches.");
            return Map.of("message", "All caches successfully cleared.");
        }

        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.info("SUPER ADMIN ACTION: Cleared cache '{}'.", cacheName);
            return Map.of("message", "Cache '" + cacheName + "' successfully cleared.");
        } else {
            return Map.of("error", "Cache '" + cacheName + "' not found.");
        }
    }
}
