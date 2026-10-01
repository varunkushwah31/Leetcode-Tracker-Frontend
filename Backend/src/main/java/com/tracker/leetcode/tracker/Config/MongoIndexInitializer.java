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
        ensureRefreshTokenIndexes();
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
                    indexOps.dropIndex("leetcodeUsername");
                }
                if ("codeforcesHandle".equals(name) && !idx.isSparse()) {
                    log.warn("Dropping legacy non-sparse index 'codeforcesHandle' on Students collection");
                    indexOps.dropIndex("codeforcesHandle");
                }
            }

            indexOps.ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
            indexOps.ensureIndex(new Index().on("leetcodeUsername", Sort.Direction.ASC).unique().sparse());
            indexOps.ensureIndex(new Index().on("codeforcesHandle", Sort.Direction.ASC).unique().sparse());

            log.info("Student collection indexes verified and initialized.");
        } catch (Exception e) {
            log.error("Failed to initialize Student indexes: {}", e.getMessage(), e);
        }
    }

    private void ensureMentorIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("Mentors");
            indexOps.ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
            log.info("Mentor collection indexes verified and initialized.");
        } catch (Exception e) {
            log.error("Failed to initialize Mentor indexes: {}", e.getMessage(), e);
        }
    }

    private void ensureRefreshTokenIndexes() {
        try {
            var indexOps = mongoTemplate.indexOps("RefreshTokens");
            indexOps.ensureIndex(new Index().on("token", Sort.Direction.ASC).unique());
            log.info("RefreshToken collection indexes verified and initialized.");
        } catch (Exception e) {
            log.error("Failed to initialize RefreshToken indexes: {}", e.getMessage(), e);
        }
    }
}
