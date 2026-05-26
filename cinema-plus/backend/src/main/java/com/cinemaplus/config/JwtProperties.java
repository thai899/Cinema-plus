package com.cinemaplus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "cinema.app")
@Getter @Setter
public class JwtProperties {
    
    // Spring Boot sẽ tự động map cấu hình từ 'cinema.app.jwtSecret' vào đây
    private String jwtSecret;
    
    // Spring Boot sẽ tự động map cấu hình từ 'cinema.app.jwtExpirationMs' vào đây
    private Long jwtExpirationMs;
}