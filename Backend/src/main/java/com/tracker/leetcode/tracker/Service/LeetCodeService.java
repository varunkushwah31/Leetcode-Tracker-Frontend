package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.StudentNotFoundException;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeetCodeService {

    private final StudentRepository studentRepository;
    private final LeetCodeApiClient leetCodeApiClient;

    /**
     * Deprecated: This service is maintained for backward compatibility only.
     * Please use StudentService instead for all new code.
     * This method fetches and updates student progress (calendar heatmap).
     * @deprecated Use {@link StudentService#fetchAndUpdateStudentProgress(String)} instead.
     */
    @SuppressWarnings("java:S1133")
    @Deprecated(since = "2.0", forRemoval = true)
    public Student fetchAndUpdateStudentProgress(String leetcodeUsername) {
        log.info("DEPRECATED: fetchAndUpdateStudentProgress called. Please use StudentService instead.");
        log.info("Starting calendar heatmap fetch for user: {}", leetcodeUsername);

        Student student = studentRepository.findByLeetcodeUsername(leetcodeUsername)
                .orElseThrow(() -> new StudentNotFoundException("Student '" + leetcodeUsername + "' not found in database."));

        student.setProgressHistory(leetCodeApiClient.fetchCalendarData(leetcodeUsername));
        return studentRepository.save(student);
    }

    /**
     * Deprecated: This service is maintained for backward compatibility only.
     * Please use StudentService instead for all new code.
     * This method fetches and updates problem statistics.
     * @deprecated Use {@link StudentService#fetchAndUpdateProblemStats(String)} instead.
     */
    @Deprecated(since = "2.0", forRemoval = true)
    public Student fetchAndUpdateProblemStats(String leetcodeUsername) {
        log.info("DEPRECATED: fetchAndUpdateProblemStats called. Please use StudentService instead.");
        log.info("Starting problem stats fetch for user: {}", leetcodeUsername);

        Student student = studentRepository.findByLeetcodeUsername(leetcodeUsername)
                .orElseThrow(() -> new StudentNotFoundException("Student '" + leetcodeUsername + "' not found in database. Please add them first!"));

        student.setProblemStats(leetCodeApiClient.fetchProblemStats(leetcodeUsername));
        return studentRepository.save(student);
    }
}