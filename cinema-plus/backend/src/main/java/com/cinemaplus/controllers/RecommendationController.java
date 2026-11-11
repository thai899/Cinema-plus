package com.cinemaplus.controllers;

import com.cinemaplus.entities.Movie;
import com.cinemaplus.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * GET /api/recommendations
     * Trả về danh sách 5 phim gợi ý thông minh cho người dùng hiện tại
     */
    @GetMapping
    public ResponseEntity<?> getPersonalizedRecommendations(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để xem phim gợi ý."));
        }

        String username = authentication.getName();
        List<Movie> recommendations = recommendationService.getRecommendationsForUser(username);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", recommendations,
            "total", recommendations.size()
        ));
    }
}

