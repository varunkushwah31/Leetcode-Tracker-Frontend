package com.tracker.leetcode.tracker.Config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class MongoIndexInitializer implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) {
        log.info("Checking and initializing MongoDB indexes safely...");
        ensureStudentIndexes();
        ensureMentorIndexes();
        ensureClassroomIndexes();
        ensureLearningPathIndexes();
        ensureRefreshTokenIndexes();
        ensureOtpIndexes();
    }

    private void ensureStudentIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("Students");
            List<IndexInfo> existingIndexes = indexOps.getIndexInfo();

            for (IndexInfo idx : existingIndexes) {
                String name = idx.getName();
                // If legacy index exists without sparse=true, drop it to avoid IndexKeySpecsConflict
                if ("leetcodeUsername".equals(name) && !idx.isSparse()) {
                    log.warn("Dropping legacy non-sparse index 'leetcodeUsername' on Students collection");
                    try {
                        indexOps.dropIndex("leetcodeUsername");
                    } catch (Exception ignored) {}
                }
                if ("codeforcesHandle".equals(name) && !idx.isSparse()) {
                    log.warn("Dropping legacy non-sparse index 'codeforcesHandle' on Students collection");
                    try {
                        indexOps.dropIndex("codeforcesHandle");
                    } catch (Exception ignored) {}
                }
            }

            try {
                indexOps.ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
            } catch (Exception ex) {
                log.debug("Student email index already exists or matches: {}", ex.getMessage());
            }

            try {
                indexOps.ensureIndex(new Index().on("leetcodeUsername", Sort.Direction.ASC).unique().sparse());
            } catch (Exception ex) {
                log.debug("Student leetcodeUsername index already exists or matches: {}", ex.getMessage());
            }

            try {
                indexOps.ensureIndex(new Index().on("codeforcesHandle", Sort.Direction.ASC).unique().sparse());
            } catch (Exception ex) {
                log.debug("Student codeforcesHandle index already exists or matches: {}", ex.getMessage());
            }

            log.info("Student collection indexes verified and initialized.");
        } catch (Exception e) {
            log.warn("Student index verification notice: {}", e.getMessage());
        }
    }

    private void ensureMentorIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("Mentors");
            List<IndexInfo> existing = indexOps.getIndexInfo();
            boolean exists = existing.stream().anyMatch(idx -> idx.isIndexForFields(List.of("email")));
            if (!exists) {
                indexOps.ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
            }
            log.info("Mentor collection indexes verified and initialized.");
        } catch (Exception e) {
            log.debug("Mentor index check note: {}", e.getMessage());
        }
    }

    private void ensureClassroomIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("Classrooms");
            List<IndexInfo> existing = indexOps.getIndexInfo();
            if (existing.stream().noneMatch(idx -> idx.isIndexForFields(List.of("mentorId")))) {
                indexOps.ensureIndex(new Index().on("mentorId", Sort.Direction.ASC));
            }
            if (existing.stream().noneMatch(idx -> idx.isIndexForFields(List.of("studentIds")))) {
                indexOps.ensureIndex(new Index().on("studentIds", Sort.Direction.ASC));
            }
            log.info("Classroom collection indexes verified and initialized.");
        } catch (Exception e) {
            log.debug("Classroom index check note: {}", e.getMessage());
        }
    }

    private void ensureLearningPathIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("LearningPaths");
            List<IndexInfo> existing = indexOps.getIndexInfo();
            if (existing.stream().noneMatch(idx -> idx.isIndexForFields(List.of("mentorId")))) {
                indexOps.ensureIndex(new Index().on("mentorId", Sort.Direction.ASC));
            }
            log.info("LearningPath collection indexes verified and initialized.");
        } catch (Exception e) {
            log.debug("LearningPath index check note: {}", e.getMessage());
        }
    }

    private void ensureRefreshTokenIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("RefreshTokens");
            List<IndexInfo> existing = indexOps.getIndexInfo();
            if (existing.stream().noneMatch(idx -> idx.isIndexForFields(List.of("token")))) {
                indexOps.ensureIndex(new Index().on("token", Sort.Direction.ASC).unique());
            }
            log.info("RefreshToken collection indexes verified and initialized.");
        } catch (Exception e) {
            log.debug("RefreshToken index check note: {}", e.getMessage());
        }
    }

    private void ensureOtpIndexes() {
        try {
            var regIndexOps = mongoTemplate.indexOps("student_registration_otps");
            List<IndexInfo> regExisting = regIndexOps.getIndexInfo();
            if (regExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of("email")))) {
                regIndexOps.ensureIndex(new Index().on("email", Sort.Direction.ASC));
            }
            if (regExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of("expiryDate")))) {
                regIndexOps.ensureIndex(new Index().on("expiryDate", Sort.Direction.ASC).expire(Duration.ZERO));
            }

            var resetIndexOps = mongoTemplate.indexOps("password_reset_otps");
            List<IndexInfo> resetExisting = resetIndexOps.getIndexInfo();
            if (resetExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of("email")))) {
                resetIndexOps.ensureIndex(new Index().on("email", Sort.Direction.ASC));
            }
            if (resetExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of("expiryDate")))) {
                resetIndexOps.ensureIndex(new Index().on("expiryDate", Sort.Direction.ASC).expire(Duration.ZERO));
            }
            if (resetExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of("resetToken")))) {
                resetIndexOps.ensureIndex(new Index().on("resetToken", Sort.Direction.ASC).sparse());
            }
            log.info("OTP collections indexes and TTL verified and initialized.");
        } catch (Exception e) {
            log.debug("OTP index check note: {}", e.getMessage());
        }
    }
}
