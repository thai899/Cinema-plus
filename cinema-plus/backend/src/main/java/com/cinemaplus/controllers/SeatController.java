package com.cinemaplus.controllers;

import com.cinemaplus.entities.Showtime;
import com.cinemaplus.services.SeatLockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/showtimes/{showtimeId}")
public class SeatController {

    @Autowired
    private SeatLockService seatLockService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.cinemaplus.repositories.ShowtimeRepository showtimeRepository;

    @Autowired
    private com.cinemaplus.repositories.TicketRepository ticketRepository;

    /**
     * Lấy thông tin suất chiếu (tên phim, giờ chiếu, phòng, giá cơ bản)
     */
    @GetMapping("/info")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getShowtimeInfo(@PathVariable Long showtimeId) {
        var showtimeOpt = showtimeRepository.findById(showtimeId);
        if (showtimeOpt.isEmpty()) return ResponseEntity.notFound().build();
        Showtime st = showtimeOpt.get();

        return ResponseEntity.ok(Map.of(
            "showtimeId",  st.getId(),
            "movieTitle",  st.getMovie() != null ? st.getMovie().getTitle() : "Không rõ",
            "moviePoster", st.getMovie() != null && st.getMovie().getPosterUrl() != null ? st.getMovie().getPosterUrl() : "",
            "format",      st.getMovie() != null ? st.getMovie().getFormat() : "2D",
            "screenName",  st.getScreen() != null ? st.getScreen().getName() : "",
            "startTime",   st.getStartTime() != null ? st.getStartTime().toString() : "",
            "endTime",     st.getEndTime() != null ? st.getEndTime().toString() : "",
            "basePrice",   st.getBasePrice()
        ));
    }

    @PostMapping("/seats/{seatId}/lock")
    public ResponseEntity<?> lockSeat(@PathVariable Long showtimeId, @PathVariable Long seatId, Authentication authentication) {
        String username = authentication.getName();
        boolean locked = seatLockService.lockSeat(showtimeId, seatId, username);
        
        if (locked) {
            messagingTemplate.convertAndSend("/topic/showtime/" + showtimeId, Map.of(
                "action", "LOCK",
                "seatId", seatId,
                "username", username
            ));
            return ResponseEntity.ok(Map.of("message", "Seat locked successfully"));
        } else {
            return ResponseEntity.status(409).body(Map.of("message", "Seat is already locked or booked"));
        }
    }

    @PostMapping("/seats/{seatId}/unlock")
    public ResponseEntity<?> unlockSeat(@PathVariable Long showtimeId, @PathVariable Long seatId, Authentication authentication) {
        String username = authentication.getName();
        seatLockService.unlockSeat(showtimeId, seatId, username);
        
        messagingTemplate.convertAndSend("/topic/showtime/" + showtimeId, Map.of(
            "action", "UNLOCK",
            "seatId", seatId
        ));
        
        return ResponseEntity.ok(Map.of("message", "Seat unlocked successfully"));
    }

    @GetMapping("/seats/locked")
    public ResponseEntity<?> getLockedSeats(@PathVariable Long showtimeId) {
        Set<Long> lockedSeats = seatLockService.getLockedSeats(showtimeId);
        return ResponseEntity.ok(lockedSeats);
    }

    @GetMapping("/seats")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getSeats(@PathVariable Long showtimeId) {
        var showtimeOpt = showtimeRepository.findById(showtimeId);
        if (showtimeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var showtime = showtimeOpt.get();
        var seats = showtime.getScreen().getSeats();
        
        var tickets = ticketRepository.findByShowtimeId(showtimeId);
        Set<Long> bookedSeatIds = tickets.stream().map(t -> t.getSeat().getId()).collect(Collectors.toSet());
        Set<Long> lockedSeatIds = seatLockService.getLockedSeats(showtimeId);

        java.util.List<com.cinemaplus.dtos.SeatStatusDTO> seatStatusList = seats.stream().map(seat -> {
            com.cinemaplus.dtos.SeatStatusDTO dto = new com.cinemaplus.dtos.SeatStatusDTO();
            dto.setId(seat.getId());
            dto.setSeatRow(seat.getSeatRow());
            dto.setSeatNumber(seat.getSeatNumber());
            dto.setType(seat.getType());
            
            if (bookedSeatIds.contains(seat.getId())) {
                dto.setStatus("BOOKED");
            } else if (lockedSeatIds.contains(seat.getId())) {
                dto.setStatus("LOCKED");
                dto.setLockedBy(seatLockService.getSeatLockUser(showtimeId, seat.getId()));
            } else {
                dto.setStatus("AVAILABLE");
            }
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(seatStatusList);
    }
}
