package com.tracker.leetcode.tracker.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class RedisWebSocketBridge implements MessageListener {

    public static final String CLASSROOM_EVENTS_TOPIC = "mentorsync:classroom:events";

    private final StringRedisTemplate stringRedisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final ChannelTopic channelTopic;

    public RedisWebSocketBridge(
            StringRedisTemplate stringRedisTemplate,
            @Lazy SimpMessagingTemplate messagingTemplate,
            ObjectMapper redisObjectMapper
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = redisObjectMapper;
        this.channelTopic = new ChannelTopic(CLASSROOM_EVENTS_TOPIC);
    }

    public ChannelTopic getChannelTopic() {
        return channelTopic;
    }

    /**
     * Publishes a classroom event to the Redis topic so all cluster nodes can dispatch it to connected WebSockets.
     */
    public void broadcastClassroomUpdate(String classroomId, String action, String message) {
        if (classroomId == null || classroomId.isBlank()) return;

        Map<String, Object> event = new HashMap<>();
        event.put("classroomId", classroomId);
        event.put("action", action != null ? action : "UPDATE");
        event.put("message", message != null ? message : "Classroom updated");

        try {
            String json = objectMapper.writeValueAsString(event);
            stringRedisTemplate.convertAndSend(CLASSROOM_EVENTS_TOPIC, json);
            log.debug("Published classroom update to Redis topic [{}] for class: {}", CLASSROOM_EVENTS_TOPIC, classroomId);
        } catch (Exception ex) {
            log.warn("Redis pub/sub unavailable, delivering directly to local WebSocket template: {}", ex.getMessage());
            // Fallback to local dispatch
            dispatchLocally(classroomId, event);
        }
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String body = new String(message.getBody(), StandardCharsets.UTF_8);
            @SuppressWarnings("unchecked")
            Map<String, Object> event = objectMapper.readValue(body, Map.class);
            String classroomId = (String) event.get("classroomId");
            if (classroomId != null) {
                dispatchLocally(classroomId, event);
            }
        } catch (Exception ex) {
            log.error("Failed to process Redis WebSocket message: {}", ex.getMessage());
        }
    }

    private void dispatchLocally(String classroomId, Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/classrooms/" + classroomId, payload);
            log.debug("Dispatched WebSocket event to /topic/classrooms/{}", classroomId);
        } catch (Exception ex) {
            log.error("Error dispatching STOMP message for classroom {}: {}", classroomId, ex.getMessage());
        }
    }
}
