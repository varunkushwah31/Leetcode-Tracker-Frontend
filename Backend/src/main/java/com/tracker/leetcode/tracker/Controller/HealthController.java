package com.tracker.leetcode.tracker.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final RedisConnectionFactory redisConnectionFactory;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", Instant.now().toString());
        response.put("service", "leetcode-tracker-backend");

        Map<String, Object> redisHealth = new HashMap<>();
        try {
            long start = System.currentTimeMillis();
            try (RedisConnection connection = redisConnectionFactory.getConnection()) {
                String ping = connection.ping();
                long latency = System.currentTimeMillis() - start;
                redisHealth.put("status", "PONG".equalsIgnoreCase(ping) ? "UP" : "DOWN");
                redisHealth.put("latencyMs", latency);
            }
        } catch (Exception ex) {
            redisHealth.put("status", "DOWN");
            redisHealth.put("error", ex.getMessage());
        }
        response.put("redis", redisHealth);

        return ResponseEntity.ok(response);
    }
}
