package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.ClassroomDashboardDTO;
import com.tracker.leetcode.tracker.DTO.MentorDTO;
import com.tracker.leetcode.tracker.DTO.SystemOverviewDTO;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Exception.ClassroomNotFoundException;
import com.tracker.leetcode.tracker.Exception.MentorNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

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

    public SystemOverviewDTO getSystemOverview(){
        log.info("Super Admin requested the master system overview.");

        try {
            long totalStudents = studentRepository.count();
            long totalMentors = mentorRepository.count();
            long totalClassrooms = classroomRepository.count();

            List<MentorDTO> mentorDTOS = mentorService.getAllMentors();
            List<ClassroomDashboardDTO> classroomDashboardDTOS = classroomRepository.findAll()
                    .stream()
                    .map(classroom -> classroomService.getClassroomDashboard(classroom.getId(), "name"))
                    .toList();

            return SystemOverviewDTO
                    .builder()
                    .totalStudents(totalStudents)
                    .totalMentors(totalMentors)
                    .totalClassrooms(totalClassrooms)
                    .allMentors(mentorDTOS)
                    .allClassrooms(classroomDashboardDTOS)
                    .build();
        } catch (Exception e) {
            log.error("Failed to generate system overview: {}", e.getMessage());
            throw new RuntimeException("Failed to generate system overview. Please try again later.");
        }
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
                // This utilizes your existing sync logic!
                studentService.syncAllProfileData(student.getLeetcodeUsername());
                successCount++;
            } catch (Exception e) {
                log.error("Failed to sync student: {}", student.getLeetcodeUsername(), e);
            }
        }

        log.info("SUPER ADMIN ACTION: Forced global sync completed.");
        return Map.of("message", "Successfully synced " + successCount + " out of " + allStudents.size() + " students.");
    }
}
