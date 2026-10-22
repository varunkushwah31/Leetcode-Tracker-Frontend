package com.tracker.leetcode.tracker.Config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class MongoIndexInitializer implements CommandLineRunner {

    private static final String FIELD_EMAIL = "email";
    private static final String FIELD_LEETCODE_USERNAME = "leetcodeUsername";
    private static final String FIELD_CODEFORCES_HANDLE = "codeforcesHandle";
    private static final String FIELD_MENTOR_ID = "mentorId";
    private static final String FIELD_EXPIRY_DATE = "expiryDate";

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
                dropLegacyIndexIfNonSparse(indexOps, idx, FIELD_LEETCODE_USERNAME);
                dropLegacyIndexIfNonSparse(indexOps, idx, FIELD_CODEFORCES_HANDLE);
            }

            safelyCreateIndex(indexOps, new Index().on(FIELD_EMAIL, Sort.Direction.ASC).unique(), "Student email");
            safelyCreateIndex(indexOps, new Index().on(FIELD_LEETCODE_USERNAME, Sort.Direction.ASC).unique().sparse(), "Student leetcodeUsername");
            safelyCreateIndex(indexOps, new Index().on(FIELD_CODEFORCES_HANDLE, Sort.Direction.ASC).unique().sparse(), "Student codeforcesHandle");

            log.info("Student collection indexes verified and initialized.");
        } catch (Exception e) {
            log.warn("Student index verification notice: {}", e.getMessage());
        }
    }

    private void dropLegacyIndexIfNonSparse(IndexOperations indexOps, IndexInfo idx, String fieldName) {
        if (fieldName.equals(idx.getName()) && !idx.isSparse()) {
            log.warn("Dropping legacy non-sparse index '{}' on Students collection", fieldName);
            try {
                indexOps.dropIndex(fieldName);
            } catch (Exception ex) {
                log.debug("Legacy index drop note for '{}': {}", fieldName, ex.getMessage());
            }
        }
    }

    private void safelyCreateIndex(IndexOperations indexOps, Index index, String description) {
        try {
            indexOps.createIndex(index);
        } catch (Exception ex) {
            log.debug("{} index already exists or matches: {}", description, ex.getMessage());
        }
    }

    private void ensureMentorIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("Mentors");
            List<IndexInfo> existing = indexOps.getIndexInfo();
            boolean exists = existing.stream().anyMatch(idx -> idx.isIndexForFields(List.of(FIELD_EMAIL)));
            if (!exists) {
                indexOps.createIndex(new Index().on(FIELD_EMAIL, Sort.Direction.ASC).unique());
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
            if (existing.stream().noneMatch(idx -> idx.isIndexForFields(List.of(FIELD_MENTOR_ID)))) {
                indexOps.createIndex(new Index().on(FIELD_MENTOR_ID, Sort.Direction.ASC));
            }
            if (existing.stream().noneMatch(idx -> idx.isIndexForFields(List.of("studentIds")))) {
                indexOps.createIndex(new Index().on("studentIds", Sort.Direction.ASC));
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
            if (existing.stream().noneMatch(idx -> idx.isIndexForFields(List.of(FIELD_MENTOR_ID)))) {
                indexOps.createIndex(new Index().on(FIELD_MENTOR_ID, Sort.Direction.ASC));
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
                indexOps.createIndex(new Index().on("token", Sort.Direction.ASC).unique());
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
            if (regExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of(FIELD_EMAIL)))) {
                regIndexOps.createIndex(new Index().on(FIELD_EMAIL, Sort.Direction.ASC));
            }
            if (regExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of(FIELD_EXPIRY_DATE)))) {
                regIndexOps.createIndex(new Index().on(FIELD_EXPIRY_DATE, Sort.Direction.ASC).expire(Duration.ZERO));
            }

            var resetIndexOps = mongoTemplate.indexOps("password_reset_otps");
            List<IndexInfo> resetExisting = resetIndexOps.getIndexInfo();
            if (resetExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of(FIELD_EMAIL)))) {
                resetIndexOps.createIndex(new Index().on(FIELD_EMAIL, Sort.Direction.ASC));
            }
            if (resetExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of(FIELD_EXPIRY_DATE)))) {
                resetIndexOps.createIndex(new Index().on(FIELD_EXPIRY_DATE, Sort.Direction.ASC).expire(Duration.ZERO));
            }
            if (resetExisting.stream().noneMatch(idx -> idx.isIndexForFields(List.of("resetToken")))) {
                resetIndexOps.createIndex(new Index().on("resetToken", Sort.Direction.ASC).sparse());
            }
            log.info("OTP collections indexes and TTL verified and initialized.");
        } catch (Exception e) {
            log.debug("OTP index check note: {}", e.getMessage());
        }
    }
}
