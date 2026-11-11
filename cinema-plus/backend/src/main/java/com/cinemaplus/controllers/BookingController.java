package com.cinemaplus.controllers;

import com.cinemaplus.entities.*;
import com.cinemaplus.repositories.*;
import com.cinemaplus.services.SeatLockService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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

@Slf4j
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    @Autowired private BookingRepository    bookingRepository;
    @Autowired private TicketRepository     ticketRepository;
    @Autowired private UserRepository       userRepository;
    @Autowired private ShowtimeRepository   showtimeRepository;
    @Autowired private SeatRepository       seatRepository;
    @Autowired private SeatLockService      seatLockService;

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/bookings
    // Tạo booking sau thanh toán thành công:
    //   1. Xác nhận lock còn hiệu lực cho TẤT CẢ ghế.
    //   2. Tạo Booking + Tickets trong SQL Server (@Transactional).
    //   3. Xóa key Redis (unlock từng ghế).
    //   Nếu lock hết hạn → 409 Conflict (không cho thanh toán).
    // ══════════════════════════════════════════════════════════════════════════
    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("User không tồn tại: " + username));

        Long showtimeId    = Long.valueOf(request.get("showtimeId").toString());
        List<?> seatIdsRaw = (List<?>) request.get("seatIds");
        Showtime showtime  = showtimeRepository.findById(showtimeId).orElseThrow(
                () -> new RuntimeException("Showtime không tồn tại: " + showtimeId));

        // ── BƯỚC 1: Xác nhận Redis lock còn hiệu lực cho TỪNG ghế ────────────
        // Nếu user mất > 5 phút → lock đã expire → từ chối thanh toán
        List<Long> expiredSeats = new ArrayList<>();
        List<Long> seatIds      = new ArrayList<>();

        for (Object raw : seatIdsRaw) {
            Long seatId = Long.parseLong(raw.toString());
            seatIds.add(seatId);
            if (!seatLockService.isLockedByUser(showtimeId, seatId, username)) {
                expiredSeats.add(seatId);
            }
        }

        if (!expiredSeats.isEmpty()) {
            log.warn("[Booking] Lock expired for user={} showtime={} seats={}",
                    username, showtimeId, expiredSeats);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error",        "LOCK_EXPIRED",
                    "expiredSeats", expiredSeats,
                    "message",      "Phiên giữ ghế đã hết hạn (5 phút). Vui lòng chọn lại ghế."
            ));
        }

        // ── BƯỚC 2: Tính tổng tiền ────────────────────────────────────────────
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (Long seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId).orElseThrow();
            totalAmount = totalAmount.add(calcSeatPrice(showtime.getBasePrice(), seat.getType()));
        }

        // ── BƯỚC 3: Tạo Booking (SQL Server) ─────────────────────────────────
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setBookingTime(LocalDateTime.now());
        booking.setPaymentMethod(request.getOrDefault("paymentMethod", "VNPAY").toString());
        booking.setPaymentStatus("PAID");
        booking.setTotalAmount(totalAmount);
        booking = bookingRepository.save(booking);

        // ── BƯỚC 4: Cộng điểm tích lũy (1 điểm / 10.000đ) ───────────────────
        int pointsEarned = totalAmount.divide(new BigDecimal("10000")).intValue();
        user.setLoyaltyPoints(
                (user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints()) + pointsEarned);
        userRepository.save(user);

        // ── BƯỚC 5: Tạo Ticket + XÓA Redis lock ──────────────────────────────
        List<Map<String, Object>> ticketList = new ArrayList<>();
        for (Long seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId).orElseThrow();
            BigDecimal price = calcSeatPrice(showtime.getBasePrice(), seat.getType());

            String qrCode = "QR_" + UUID.randomUUID().toString()
                    .replace("-", "").substring(0, 12).toUpperCase();

            Ticket ticket = new Ticket();
            ticket.setBooking(booking);
            ticket.setSeat(seat);
            ticket.setShowtimeId(showtimeId);
            ticket.setPrice(price);
            ticket.setStatus(TicketStatus.VALID);
            ticket.setIsCheckedIn(false);
            ticket.setQrCode(qrCode);
            ticket.setQrCodeString(qrCode);
            ticketRepository.save(ticket);   // ← Lưu SQL Server

            // ✅ Xóa key Redis sau khi lưu DB thành công
            boolean released = seatLockService.unlock(showtimeId, seatId, username);
            log.info("[Booking] Redis unlock seat={} released={}", seatId, released);

            ticketList.add(Map.of(
                    "ticketId",   ticket.getId(),
                    "seatRow",    seat.getSeatRow(),
                    "seatNumber", seat.getSeatNumber(),
                    "seatType",   seat.getType(),
                    "price",      price,
                    "qrCode",     qrCode
            ));
        }

        log.info("[Booking] SUCCESS user={} showtime={} seats={} total={} points=+{}",
                username, showtimeId, seatIds, totalAmount, pointsEarned);

        return ResponseEntity.ok(Map.of(
                "message",      "Đặt vé thành công! Vui lòng kiểm tra vé trong trang cá nhân.",
                "bookingId",    booking.getId(),
                "totalAmount",  totalAmount,
                "pointsEarned", pointsEarned,
                "tickets",      ticketList
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Helper: tính giá theo loại ghế
    // ══════════════════════════════════════════════════════════════════════════
    private BigDecimal calcSeatPrice(BigDecimal basePrice, String type) {
        return switch (type) {
            case "VIP"             -> basePrice.add(new BigDecimal("30000"));
            case "SWEETBOX_DOUBLE" -> basePrice.add(new BigDecimal("80000"));
            default                -> basePrice;
        };
    }
}
