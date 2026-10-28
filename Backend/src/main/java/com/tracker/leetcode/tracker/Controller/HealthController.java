package com.tracker.leetcode.tracker.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class HealthController {

    private static final String STATUS_KEY = "status";
    private static final String STATUS_UP = "UP";
    private static final String STATUS_DOWN = "DOWN";
    private static final String SERVICE_NAME = "leetcode-tracker-backend";

    private final RedisConnectionFactory redisConnectionFactory;

    @RequestMapping(
            value = {"/health", "/api/health", "/ping"},
            method = {RequestMethod.GET, RequestMethod.HEAD},
            produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_PLAIN_VALUE}
    )
    public ResponseEntity<Object> health(
            @RequestParam(name = "format", required = false) String format,
            @RequestHeader(name = "Accept", required = false) String acceptHeader
    ) {
        String redisStatus = checkRedisStatus();

        if ("text".equalsIgnoreCase(format) || (acceptHeader != null && acceptHeader.contains("text/plain") && !acceptHeader.contains("application/json"))) {
            return ResponseEntity.ok(STATUS_UP);
        }

        Map<String, Object> response = new HashMap<>();
        response.put(STATUS_KEY, STATUS_UP);
        response.put("service", SERVICE_NAME);
        response.put("redis", Collections.singletonMap(STATUS_KEY, redisStatus));

        return ResponseEntity.ok(response);
    }

    private String checkRedisStatus() {
        if (redisConnectionFactory == null) {
            return STATUS_DOWN;
        }
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            String ping = connection.ping();
            return "PONG".equalsIgnoreCase(ping) ? STATUS_UP : STATUS_DOWN;
        } catch (Exception ex) {
            log.warn("Redis health check probe failed: {}", ex.getMessage());
            return STATUS_DOWN;
        }
    }
}

