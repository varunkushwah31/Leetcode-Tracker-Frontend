package com.tracker.leetcode.tracker.Security;

import com.mongodb.client.MongoClient;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.mongo.MongoLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
// defaultLockAtMostFor is a failsafe. If a server crashes while holding the lock,
// the lock will automatically release after 10 minutes so it isn't stuck forever.
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class ShedLockConfig {

    @Value("${spring.data.mongodb.database:LeetcodeTracker}")
    private String databaseName;

    @Bean
    public LockProvider lockProvider(MongoClient mongoClient) {
        return new MongoLockProvider(mongoClient.getDatabase(databaseName));
    }
}