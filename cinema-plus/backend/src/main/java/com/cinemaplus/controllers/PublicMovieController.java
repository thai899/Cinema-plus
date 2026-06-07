package com.cinemaplus.controllers;

import com.cinemaplus.entities.Movie;
import com.cinemaplus.services.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller public — Không yêu cầu xác thực JWT
 * Cho phép trang chủ load danh sách phim đang chiếu
 */
@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "http://localhost:5173")
public class PublicMovieController {

    @Autowired
    private MovieService movieService;

    /**
     * GET /api/movies — Danh sách tất cả phim (public)
     */
    @GetMapping
    public ResponseEntity<?> getAllMovies() {
        List<Movie> movies = movieService.getAllMovies();
        // Trả DTO gọn để tránh lazy loading exception
        List<Map<String, Object>> result = movies.stream().map(m -> {
            Map<String, Object> dto = new java.util.HashMap<>();
            dto.put("id",          m.getId());
            dto.put("title",       m.getTitle());
            dto.put("format",      m.getFormat());
            dto.put("duration",    m.getDuration());
            dto.put("ageLimit",    m.getAgeLimit());
            dto.put("posterUrl",   m.getPosterUrl() != null ? m.getPosterUrl() : "");
            dto.put("description", m.getDescription() != null ? m.getDescription() : "");
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/movies/{id} — Chi tiết một phim (public)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMovieById(@PathVariable Long id) {
        Movie m = movieService.getMovieById(id);
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id",          m.getId());
        dto.put("title",       m.getTitle());
        dto.put("format",      m.getFormat());
        dto.put("duration",    m.getDuration());
        dto.put("ageLimit",    m.getAgeLimit());
        dto.put("posterUrl",   m.getPosterUrl() != null ? m.getPosterUrl() : "");
        dto.put("description", m.getDescription() != null ? m.getDescription() : "");
        return ResponseEntity.ok(dto);
    }
}
