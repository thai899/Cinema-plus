package com.cinemaplus.config;

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
        // Kích hoạt broker để đẩy dữ liệu về client. 
        // /topic/logs dùng cho Audit Logs, /topic/tickets dùng cho trạng thái vé
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đăng ký cổng kết nối socket dưới client kẹp cấu hình CORS chấp nhận cổng React (5173)
        registry.addEndpoint("/ws-cinema")
                .setAllowedOrigins("http://localhost:5173")
                .withSockJS();
    }
}