package com.cinemaplus.controllers;

import com.cinemaplus.entities.Screen;
import com.cinemaplus.entities.Seat;
import com.cinemaplus.services.ScreenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/screens")
@CrossOrigin(origins = "http://localhost:5173")
public class ScreenController {

    @Autowired
    private ScreenService screenService;

    @GetMapping
    public ResponseEntity<List<Screen>> getAllScreens() {
        return ResponseEntity.ok(screenService.getAllScreens());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Screen> getScreenById(@PathVariable Long id) {
        return ResponseEntity.ok(screenService.getScreenById(id));
    }

    @PostMapping
    public ResponseEntity<Screen> createScreen(@Valid @RequestBody Screen screen) {
        return ResponseEntity.ok(screenService.createScreen(screen));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<Seat>> getSeatsByScreenId(@PathVariable Long id) {
        return ResponseEntity.ok(screenService.getSeatsByScreenId(id));
    }

    @PostMapping("/{id}/generate-seats")
    public ResponseEntity<?> generateSeats(@PathVariable Long id) {
        screenService.generateSeatMatrix(id);
        return ResponseEntity.ok(Map.of(
            "message", "Khởi tạo ma trận ghế tự động cho phòng chiếu thành công!",
            "screenId", id
        ));
    }
}
