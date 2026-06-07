package com.cinemaplus.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDate;

@Component
public class ApiTrafficInterceptor implements HandlerInterceptor {

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api/")) {
            try {
                String today = LocalDate.now().toString();
                redisTemplate.opsForValue().increment("api_traffic:" + today);
            } catch (Exception e) {
                System.err.println("Redis is unavailable for traffic tracking: " + e.getMessage());
            }
        }
        return true;
    }
}
