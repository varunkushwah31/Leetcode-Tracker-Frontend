package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.DailyChallengeDTO;
import com.tracker.leetcode.tracker.Models.Classroom;
import com.tracker.leetcode.tracker.Models.RecentSubmission;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.ClassroomRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyChallengeService {

    private final LeetCodeApiClient leetCodeApiClient;
    private final CodeforcesApiClient codeforcesApiClient;
    private final StudentRepository studentRepository;
    private final ClassroomRepository classroomRepository;

    public DailyChallengeDTO getDailyChallenge(String studentIdentifier, String classroomId) {
        LeetCodeApiClient.LeetCodeDailyQuestion lcPotd = leetCodeApiClient.fetchDailyCodingChallenge();
        CodeforcesApiClient.CodeforcesDailyPick cfPick = codeforcesApiClient.fetchDailyPick();

        String today = LocalDate.now(ZoneId.of("UTC")).toString();

        DailyChallengeDTO.DailyChallengeDTOBuilder builder = DailyChallengeDTO.builder()
                .date(today)
                // LeetCode info
                .leetcodeFrontendId(lcPotd.questionFrontendId())
                .leetcodeTitle(lcPotd.title())
                .leetcodeTitleSlug(lcPotd.titleSlug())
                .leetcodeDifficulty(lcPotd.difficulty())
                .leetcodeUrl(lcPotd.url())
                .leetcodeTopicTags(lcPotd.topicTags())
                // Codeforces info
                .codeforcesTitle(cfPick.title())
                .codeforcesContestId(cfPick.contestId())
                .codeforcesIndex(cfPick.index())
                .codeforcesRating(cfPick.rating())
                .codeforcesUrl(cfPick.url())
                .codeforcesTags(cfPick.tags())
                .userSolvedLeetcode(false)
                .userSolvedCodeforces(false)
                .userSolved(false);

        Student student = resolveStudent(studentIdentifier);
        boolean solvedLc = false;
        boolean solvedCf = false;

        if (student != null) {
            solvedLc = hasSolvedLeetcodeChallenge(student, lcPotd.titleSlug(), lcPotd.title());
            solvedCf = hasSolvedCodeforcesChallenge(student, cfPick.contestId(), cfPick.index(), cfPick.title());
            builder.userSolvedLeetcode(solvedLc);
            builder.userSolvedCodeforces(solvedCf);
            builder.userSolved(solvedLc || solvedCf);
        }

        // Determine classroom for ticker
        Classroom classroom = resolveClassroom(student, classroomId);
        if (classroom != null && classroom.getStudentIds() != null && !classroom.getStudentIds().isEmpty()) {
            List<Student> classmates = studentRepository.findAllById(classroom.getStudentIds());
            int total = classmates.size();
            int solvedCount = 0;

            for (Student s : classmates) {
                boolean sSolved = hasSolvedLeetcodeChallenge(s, lcPotd.titleSlug(), lcPotd.title()) ||
                        hasSolvedCodeforcesChallenge(s, cfPick.contestId(), cfPick.index(), cfPick.title());
                if (sSolved) {
                    solvedCount++;
                }
            }

            builder.classroomName(classroom.getClassName());
            builder.classroomTotalStudents(total);
            builder.classroomSolvedCount(solvedCount);
            builder.classroomSolvedPercentage(total > 0 ? Math.round(((double) solvedCount / total) * 1000.0) / 10.0 : 0.0);
        }

        return builder.build();
    }

    private Student resolveStudent(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        return studentRepository.findById(identifier)
                .or(() -> studentRepository.findByEmail(identifier))
                .or(() -> studentRepository.findByLeetcodeUsername(identifier))
                .or(() -> studentRepository.findByCodeforcesHandle(identifier))
                .orElse(null);
    }

    private Classroom resolveClassroom(Student student, String classroomId) {
        if (classroomId != null && !classroomId.isBlank()) {
            return classroomRepository.findById(classroomId).orElse(null);
        }
        if (student != null && student.getId() != null) {
            List<Classroom> classrooms = classroomRepository.findByStudentIdsContaining(student.getId());
            if (!classrooms.isEmpty()) {
                return classrooms.get(0);
            }
        }
        return null;
    }

    private boolean hasSolvedLeetcodeChallenge(Student s, String titleSlug, String title) {
        if (s == null || s.getRecentSubmissions() == null) return false;
        String cleanSlug = titleSlug != null ? titleSlug.trim().toLowerCase() : "";
        String cleanTitle = title != null ? title.trim().toLowerCase() : "";

        for (RecentSubmission sub : s.getRecentSubmissions()) {
            if (sub.getPlatform() == null || sub.getPlatform() == com.tracker.leetcode.tracker.Models.Platform.LEETCODE) {
                String subSlug = sub.getTitleSlug() != null ? sub.getTitleSlug().trim().toLowerCase() : "";
                String subTitle = sub.getTitle() != null ? sub.getTitle().trim().toLowerCase() : "";
                if ((!cleanSlug.isEmpty() && cleanSlug.equalsIgnoreCase(subSlug)) ||
                        (!cleanTitle.isEmpty() && cleanTitle.equalsIgnoreCase(subTitle))) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean hasSolvedCodeforcesChallenge(Student s, int contestId, String index, String title) {
        if (s == null || s.getRecentSubmissions() == null) return false;
        String targetProblemNumber = contestId + (index != null ? index.trim().toUpperCase() : "");
        String cleanTitle = title != null ? title.trim().toLowerCase() : "";

        for (RecentSubmission sub : s.getRecentSubmissions()) {
            if (sub.getPlatform() == com.tracker.leetcode.tracker.Models.Platform.CODEFORCES) {
                String subTitle = sub.getTitle() != null ? sub.getTitle().trim().toLowerCase() : "";
                String subSlug = sub.getTitleSlug() != null ? sub.getTitleSlug().trim().toUpperCase() : "";
                if (subSlug.contains(targetProblemNumber) || (!cleanTitle.isEmpty() && subTitle.contains(cleanTitle))) {
                    return true;
                }
            }
        }
        return false;
    }
}
