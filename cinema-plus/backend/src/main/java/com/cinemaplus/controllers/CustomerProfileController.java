package com.cinemaplus.controllers;

import com.cinemaplus.entities.Booking;
import com.cinemaplus.entities.Ticket;
import com.cinemaplus.entities.User;
import com.cinemaplus.repositories.BookingRepository;
import com.cinemaplus.repositories.TicketRepository;
import com.cinemaplus.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerProfileController {

    @Autowired private UserRepository userRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private TicketRepository ticketRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String username = authentication.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        // Tính hạng thành viên dựa trên điểm tích lũy
        int points = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        String tier;
        if (points >= 5000)      tier = "VVIP PLATINUM";
        else if (points >= 2000) tier = "VIP GOLD";
        else if (points >= 500)  tier = "SILVER";
        else                     tier = "MEMBER";

        return ResponseEntity.ok(Map.of(
            "id",           user.getId(),
            "username",     user.getUsername(),
            "fullName",     user.getFullName() != null ? user.getFullName() : user.getUsername(),
            "email",        user.getEmail() != null ? user.getEmail() : "",
            "phone",        user.getPhone() != null ? user.getPhone() : "",
            "loyaltyPoints", points,
            "memberTier",   tier,
            "memberId",     String.format("CP-%04d-%04d", user.getId(), points % 10000)
        ));
    }

    @GetMapping("/bookings")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyBookings(Authentication authentication) {
        String username = authentication.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<Booking> bookings = bookingRepository.findByUserId(userOpt.get().getId());
        List<Map<String, Object>> result = new ArrayList<>();

        for (Booking b : bookings) {
            // Lấy danh sách vé của booking này kèm thông tin ghế và QR
            List<Ticket> tickets = ticketRepository.findByBookingIdWithSeat(b.getId());
            List<Map<String, Object>> ticketDTOs = new ArrayList<>();
            for (Ticket t : tickets) {
                ticketDTOs.add(Map.of(
                    "ticketId",    t.getId(),
                    "seatRow",     t.getSeat() != null ? t.getSeat().getSeatRow() : "?",
                    "seatNumber",  t.getSeat() != null ? t.getSeat().getSeatNumber() : 0,
                    "seatType",    t.getSeat() != null ? t.getSeat().getType() : "SINGLE",
                    "price",       t.getPrice(),
                    "qrCode",      t.getQrCodeString() != null ? t.getQrCodeString() : "QR_" + t.getId(),
                    "status",      t.getStatus() != null ? t.getStatus().name() : "VALID"
                ));
            }

            String movieTitle = "Không rõ";
            String screenName = "";
            String cinemaName = "";
            String startTime  = "";
            if (b.getShowtime() != null) {
                if (b.getShowtime().getMovie() != null) movieTitle = b.getShowtime().getMovie().getTitle();
                if (b.getShowtime().getStartTime() != null) startTime = b.getShowtime().getStartTime().toString();
                if (b.getShowtime().getScreen() != null) {
                    screenName = b.getShowtime().getScreen().getName();
                    if (b.getShowtime().getScreen().getCinema() != null)
                        cinemaName = b.getShowtime().getScreen().getCinema().getName();
                }
            }

            result.add(Map.of(
                "id",            b.getId(),
                "bookingTime",   b.getBookingTime() != null ? b.getBookingTime().toString() : "",
                "totalAmount",   b.getTotalAmount(),
                "paymentStatus", b.getPaymentStatus(),
                "paymentMethod", b.getPaymentMethod(),
                "movieTitle",    movieTitle,
                "screenName",    screenName,
                "cinemaName",    cinemaName,
                "startTime",     startTime,
                "tickets",       ticketDTOs
            ));
        }

        return ResponseEntity.ok(result);
    }
}
