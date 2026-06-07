package com.cinemaplus.controllers;

import com.cinemaplus.entities.*;
import com.cinemaplus.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * API quản lý Suất chiếu dành cho Admin.
 * - GET  /api/admin/showtimes          → Danh sách tất cả suất chiếu
 * - POST /api/admin/showtimes          → Tạo suất chiếu mới (tự tính end_time + kiểm tra trùng lịch)
 * - PUT  /api/admin/showtimes/{id}     → Cập nhật giá suất chiếu
 * - DELETE /api/admin/showtimes/{id}   → Xóa suất chiếu (chỉ khi chưa có booking)
 */
@RestController
@RequestMapping("/api/admin/showtimes")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminShowtimeController {

    @Autowired private ShowtimeRepository showtimeRepository;
    @Autowired private MovieRepository movieRepository;
    @Autowired private ScreenRepository screenRepository;
    @Autowired private BookingRepository bookingRepository;

    // ─── GET ALL ─────────────────────────────────────────────────────────────
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllShowtimes() {
        List<Showtime> showtimes = showtimeRepository.findAll();
        List<Map<String, Object>> result = showtimes.stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ─── GET BY MOVIE ─────────────────────────────────────────────────────────
    @GetMapping("/movie/{movieId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getByMovie(@PathVariable Long movieId) {
        List<Showtime> showtimes = showtimeRepository.findByMovieIdOrderByStartTimeAsc(movieId);
        return ResponseEntity.ok(showtimes.stream().map(this::toDto).collect(Collectors.toList()));
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────
    @PostMapping
    @Transactional
    public ResponseEntity<?> createShowtime(@RequestBody Map<String, Object> request) {
        Long movieId  = Long.valueOf(request.get("movieId").toString());
        Long screenId = Long.valueOf(request.get("screenId").toString());
        String startTimeStr = request.get("startTime").toString();
        BigDecimal basePrice = new BigDecimal(request.get("basePrice").toString());

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Phim không tồn tại: " + movieId));
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Phòng chiếu không tồn tại: " + screenId));

        LocalDateTime startTime = LocalDateTime.parse(startTimeStr);
        // Tự tính end_time = start_time + duration(phút) + 15 phút nghỉ dọn phòng
        LocalDateTime endTime = startTime.plusMinutes(movie.getDuration() + 15);

        // Kiểm tra trùng lịch trong cùng phòng chiếu
        List<Showtime> existing = showtimeRepository.findAll().stream()
                .filter(s -> s.getScreen().getId().equals(screenId))
                .filter(s -> {
                    LocalDateTime eStart = s.getStartTime();
                    LocalDateTime eEnd   = s.getEndTime();
                    // Overlap check: new overlaps existing if newStart < eEnd && newEnd > eStart
                    return startTime.isBefore(eEnd) && endTime.isAfter(eStart);
                })
                .collect(Collectors.toList());

        if (!existing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Phòng chiếu đã bị trùng lịch với suất chiếu khác!",
                "conflictWith", toDto(existing.get(0))
            ));
        }

        Showtime showtime = new Showtime();
        showtime.setMovie(movie);
        showtime.setScreen(screen);
        showtime.setStartTime(startTime);
        showtime.setEndTime(endTime);
        showtime.setBasePrice(basePrice);
        showtime = showtimeRepository.save(showtime);

        return ResponseEntity.ok(toDto(showtime));
    }

    // ─── UPDATE (chỉ cập nhật giá và thời gian) ──────────────────────────────
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateShowtime(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suất chiếu không tồn tại"));

        if (request.containsKey("basePrice")) {
            showtime.setBasePrice(new BigDecimal(request.get("basePrice").toString()));
        }
        if (request.containsKey("startTime")) {
            LocalDateTime newStart = LocalDateTime.parse(request.get("startTime").toString());
            LocalDateTime newEnd   = newStart.plusMinutes(showtime.getMovie().getDuration() + 15);
            showtime.setStartTime(newStart);
            showtime.setEndTime(newEnd);
        }
        showtimeRepository.save(showtime);
        return ResponseEntity.ok(toDto(showtime));
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteShowtime(@PathVariable Long id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suất chiếu không tồn tại"));

        // Kiểm tra xem đã có booking chưa
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getShowtime() != null && b.getShowtime().getId().equals(id))
                .collect(Collectors.toList());

        if (!bookings.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Không thể xóa suất chiếu đã có " + bookings.size() + " đặt vé liên quan!"
            ));
        }

        showtimeRepository.delete(showtime);
        return ResponseEntity.ok(Map.of("message", "Xóa suất chiếu thành công!", "id", id));
    }

    // ─── DTO Helper ──────────────────────────────────────────────────────────
    private Map<String, Object> toDto(Showtime st) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", st.getId());
        map.put("startTime", st.getStartTime() != null ? st.getStartTime().toString() : "");
        map.put("endTime",   st.getEndTime()   != null ? st.getEndTime().toString()   : "");
        map.put("basePrice", st.getBasePrice());
        if (st.getMovie() != null) {
            map.put("movieId",     st.getMovie().getId());
            map.put("movieTitle",  st.getMovie().getTitle());
            map.put("movieFormat", st.getMovie().getFormat());
            map.put("duration",    st.getMovie().getDuration());
        }
        if (st.getScreen() != null) {
            map.put("screenId",   st.getScreen().getId());
            map.put("screenName", st.getScreen().getName());
            if (st.getScreen().getCinema() != null) {
                map.put("cinemaName", st.getScreen().getCinema().getName());
            }
        }
        return map;
    }
}
