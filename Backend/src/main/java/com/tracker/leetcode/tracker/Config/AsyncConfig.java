package com.tracker.leetcode.tracker.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * High-performance Async Configuration powered by Java 21+ Virtual Threads.
 * Virtual threads provide lightweight, non-blocking concurrency for I/O operations
 * (LeetCode & Codeforces API calls, database access, background emails, WebSocket broadcasts).
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Primary
    @Override
    @Bean(name = "taskExecutor")
    public AsyncTaskExecutor getAsyncExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("ms-virtual-async-");
        executor.setVirtualThreads(true);
        return executor;
    }

    /**
     * Dedicated virtual thread per-task executor for parallel batch processing
     * (e.g. bulk CSV student sync, parallel analytics calculation).
     */
    @Bean(name = "virtualThreadExecutor")
    public Executor virtualThreadExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}