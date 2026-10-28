package com.tracker.leetcode.tracker.Controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HealthControllerTest {

    private MockMvc mockMvc;
    private RedisConnectionFactory redisConnectionFactory;
    private RedisConnection redisConnection;

    @BeforeEach
    void setUp() {
        redisConnectionFactory = Mockito.mock(RedisConnectionFactory.class);
        redisConnection = Mockito.mock(RedisConnection.class);
        when(redisConnectionFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.ping()).thenReturn("PONG");

        mockMvc = MockMvcBuilders.standaloneSetup(new HealthController(redisConnectionFactory)).build();
    }

    @Test
    void healthCheckShouldReturnStatusUp() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("leetcode-tracker-backend"))
                .andExpect(jsonPath("$.redis.status").value("UP"));
    }

    @Test
    void healthCheckShouldHandleRedisFailureGracefully() throws Exception {
        when(redisConnection.ping()).thenThrow(new RuntimeException("Redis connection timed out"));

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("leetcode-tracker-backend"))
                .andExpect(jsonPath("$.redis.status").value("DOWN"));
    }

    @Test
    void healthCheckShouldReturnPlainTextWhenRequested() throws Exception {
        mockMvc.perform(get("/health").param("format", "text"))
                .andExpect(status().isOk())
                .andExpect(content().string("UP"));

        mockMvc.perform(get("/health").header("Accept", MediaType.TEXT_PLAIN_VALUE))
                .andExpect(status().isOk())
                .andExpect(content().string("UP"));
    }

    @Test
    void pingEndpointShouldReturnStatusUp() throws Exception {
        mockMvc.perform(get("/ping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void headRequestShouldReturnOk() throws Exception {
        mockMvc.perform(head("/health"))
                .andExpect(status().isOk());
    }
}

