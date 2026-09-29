package com.tracker.leetcode.tracker.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // This is the prefix for outgoing messages from the server to the client
        config.enableSimpleBroker("/topic");
        // This is the prefix for incoming messages from the client (we won't use this much yet)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native STOMP WebSocket endpoint (primary for modern browsers, eliminates SockJS unload violation)
        registry.addEndpoint("/ws-endpoint")
                .setAllowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "https://*.onrender.com",
                        "*"
                );

        // SockJS fallback endpoint
        registry.addEndpoint("/ws-endpoint")
                .setAllowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "https://*.onrender.com",
                        "*"
                )
                .withSockJS();
    }
}