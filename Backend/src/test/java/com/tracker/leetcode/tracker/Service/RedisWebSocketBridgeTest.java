package com.tracker.leetcode.tracker.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.DefaultMessage;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisWebSocketBridgeTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private RedisWebSocketBridge webSocketBridge;

    @BeforeEach
    void setUp() {
        webSocketBridge = new RedisWebSocketBridge(stringRedisTemplate, messagingTemplate, objectMapper);
    }

    @Test
    void broadcastClassroomUpdate_WhenRedisAvailable_ShouldPublishToRedisTopic() {
        webSocketBridge.broadcastClassroomUpdate("class-100", "UPDATE", "Assignment added");

        verify(stringRedisTemplate, times(1)).convertAndSend(
                eq(RedisWebSocketBridge.CLASSROOM_EVENTS_TOPIC),
                contains("class-100")
        );
    }

    @Test
    void broadcastClassroomUpdate_WhenRedisFails_ShouldFallbackToDirectWebSocket() {
        doThrow(new RuntimeException("Redis connection refused"))
                .when(stringRedisTemplate).convertAndSend(anyString(), anyString());

        webSocketBridge.broadcastClassroomUpdate("class-100", "UPDATE", "Assignment added");

        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/classrooms/class-100"),
                (Object) any()
        );
    }

    @Test
    void onMessage_ShouldDeserializeAndDispatchToWebSocket() throws Exception {
        String jsonPayload = objectMapper.writeValueAsString(Map.of(
                "classroomId", "class-200",
                "action", "DELETE",
                "message", "Assignment removed"
        ));

        DefaultMessage message = new DefaultMessage(
                RedisWebSocketBridge.CLASSROOM_EVENTS_TOPIC.getBytes(StandardCharsets.UTF_8),
                jsonPayload.getBytes(StandardCharsets.UTF_8)
        );

        webSocketBridge.onMessage(message, null);

        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/classrooms/class-200"),
                (Object) any()
        );
    }

    @Test
    void getChannelTopic_ShouldReturnCorrectTopic() {
        assertEquals(RedisWebSocketBridge.CLASSROOM_EVENTS_TOPIC, webSocketBridge.getChannelTopic().getTopic());
    }
}
