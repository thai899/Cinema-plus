package com.cinemaplus.controllers;

import com.cinemaplus.entities.Showtime;
import com.cinemaplus.repositories.ShowtimeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/showtimes")
@CrossOrigin(origins = "http://localhost:5173")
public class PublicShowtimeController {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Transactional(readOnly = true)
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<?> getShowtimesForMovie(@PathVariable Long movieId) {
        List<Showtime> showtimes = showtimeRepository.findByMovieIdOrderByStartTimeAsc(movieId);

        List<Map<String, Object>> result = showtimes.stream().map(st -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", st.getId());
            map.put("startTime", st.getStartTime());
            map.put("endTime", st.getEndTime());
            map.put("basePrice", st.getBasePrice());
            map.put("roomName", st.getScreen().getName());
            map.put("cinemaId", st.getScreen().getCinema().getId());
            map.put("cinemaName", st.getScreen().getCinema().getName());
            map.put("cinemaAddress", st.getScreen().getCinema().getAddress());
            map.put("movieFormat", st.getMovie().getFormat());
            map.put("movieTitle", st.getMovie().getTitle());
            map.put("moviePoster", st.getMovie().getPosterUrl());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
