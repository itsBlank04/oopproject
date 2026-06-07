package atom.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real‑time auction updates.
 *
 * - Registers a STOMP endpoint at "/ws/auction" that supports SockJS fallback.
 * - Enables a simple in‑memory broker for destinations prefixed with "/topic".
 * - Application destination prefix is "/app" for inbound messages.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Clients subscribe to "/topic/**" for broadcasts.
        registry.enableSimpleBroker("/topic");
        // Inbound messages from clients go to "@MessageMapping" methods prefixed with "/app".
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint used by browsers to establish a WebSocket (or SockJS) connection.
        // WithSockJS provides fallback for browsers that block native WebSocket.
        registry.addEndpoint("/ws/auction")
                .setAllowedOriginPatterns("*") // Adjust in production for security.
                .withSockJS();
    }
}
