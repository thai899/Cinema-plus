package com.cinemaplus.controllers;

import com.cinemaplus.entities.*;
import com.cinemaplus.repositories.*;
import com.cinemaplus.services.SeatLockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private TicketRepository ticketRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ShowtimeRepository showtimeRepository;
    @Autowired private SeatRepository seatRepository;
    @Autowired private SeatLockService seatLockService;

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> request,
                                           Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();

        Long showtimeId = Long.valueOf(request.get("showtimeId").toString());
        List<Integer> seatIdsObj = (List<Integer>) request.get("seatIds");
        Showtime showtime = showtimeRepository.findById(showtimeId).orElseThrow();

        // ── Tính tổng tiền ─────────────────────────────────────
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (Integer seatIdInt : seatIdsObj) {
            Seat seat = seatRepository.findById(seatIdInt.longValue()).orElseThrow();
            totalAmount = totalAmount.add(calcSeatPrice(showtime.getBasePrice(), seat.getType()));
        }

        // ── Tạo Booking ────────────────────────────────────────
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setBookingTime(LocalDateTime.now());
        booking.setPaymentMethod(request.getOrDefault("paymentMethod", "VNPAY").toString());
        booking.setPaymentStatus("PAID");
        booking.setTotalAmount(totalAmount);
        booking = bookingRepository.save(booking);

        // ── Cộng điểm tích lũy (1 điểm / 10.000đ) ─────────────
        int pointsEarned = totalAmount.divide(new BigDecimal("10000")).intValue();
        user.setLoyaltyPoints((user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints()) + pointsEarned);
        userRepository.save(user);

        // ── Tạo Ticket + cập nhật trạng thái ghế ───────────────
        List<Map<String, Object>> ticketList = new ArrayList<>();
        for (Integer seatIdInt : seatIdsObj) {
            Long seatId = seatIdInt.longValue();
            Seat seat = seatRepository.findById(seatId).orElseThrow();
            BigDecimal price = calcSeatPrice(showtime.getBasePrice(), seat.getType());

            String qrCode = "QR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

            Ticket ticket = new Ticket();
            ticket.setBooking(booking);
            ticket.setSeat(seat);
            ticket.setShowtimeId(showtimeId);
            ticket.setPrice(price);
            ticket.setStatus(TicketStatus.VALID);
            ticket.setIsCheckedIn(false);
            ticket.setQrCode(qrCode);
            ticket.setQrCodeString(qrCode);
            ticketRepository.save(ticket);

            // 🔴 QUAN TRỌNG: Cập nhật trạng thái ghế trong DB thành BOOKED
            // Seat entity không có trường status trong DB — chúng ta track qua Ticket
            // Unlock khỏi Redis
            seatLockService.unlockSeat(showtimeId, seatId, username);

            ticketList.add(Map.of(
                "ticketId", ticket.getId(),
                "seatRow", seat.getSeatRow(),
                "seatNumber", seat.getSeatNumber(),
                "seatType", seat.getType(),
                "price", price,
                "qrCode", qrCode
            ));
        }

        return ResponseEntity.ok(Map.of(
            "message", "Đặt vé thành công! Vui lòng kiểm tra vé trong trang cá nhân.",
            "bookingId", booking.getId(),
            "totalAmount", totalAmount,
            "pointsEarned", pointsEarned,
            "tickets", ticketList
        ));
    }

    private BigDecimal calcSeatPrice(BigDecimal basePrice, String type) {
        return switch (type) {
            case "VIP"             -> basePrice.add(new BigDecimal("30000"));
            case "SWEETBOX_DOUBLE" -> basePrice.add(new BigDecimal("80000"));
            default                -> basePrice;
        };
    }
}
