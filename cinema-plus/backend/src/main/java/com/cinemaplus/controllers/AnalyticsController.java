package com.cinemaplus.controllers;

import com.cinemaplus.entities.Booking;
import com.cinemaplus.repositories.BookingRepository;
import com.cinemaplus.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyticsController {

    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private TicketRepository ticketRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        String today = LocalDate.now().toString();
        long apiTraffic = 0;
        try {
            String apiTrafficStr = redisTemplate.opsForValue().get("api_traffic:" + today);
            apiTraffic = apiTrafficStr != null ? Long.parseLong(apiTrafficStr) : 0;
        } catch (Exception e) {
            System.err.println("Redis offline during dashboard stats lookup: " + e.getMessage());
        }

        List<Booking> allBookings = bookingRepository.findAll();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal todayRevenue = BigDecimal.ZERO;
        long totalTickets = ticketRepository.count();

        LocalDate todayDate = LocalDate.now();
        for (Booking b : allBookings) {
            if ("PAID".equals(b.getPaymentStatus())) {
                totalRevenue = totalRevenue.add(b.getTotalAmount());
                if (b.getBookingTime() != null && b.getBookingTime().toLocalDate().equals(todayDate)) {
                    todayRevenue = todayRevenue.add(b.getTotalAmount());
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "apiTraffic",    apiTraffic,
            "totalRevenue",  totalRevenue,
            "todayRevenue",  todayRevenue,
            "totalTickets",  totalTickets
        ));
    }

    /**
     * Doanh thu theo ngày - trả về 7 ngày gần nhất (hoặc 30 ngày)
     * ?period=daily (7 ngày) | ?period=weekly (4 tuần gần nhất)
     */
    @GetMapping("/revenue")
    public ResponseEntity<?> getRevenueChart(@RequestParam(defaultValue = "daily") String period) {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Map<String, Object>> chartData = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");

        if ("weekly".equals(period)) {
            // 4 tuần gần nhất
            for (int w = 3; w >= 0; w--) {
                LocalDate weekStart = LocalDate.now().minusWeeks(w).with(java.time.DayOfWeek.MONDAY);
                LocalDate weekEnd = weekStart.plusDays(6);
                BigDecimal weekRevenue = BigDecimal.ZERO;
                for (Booking b : allBookings) {
                    if ("PAID".equals(b.getPaymentStatus()) && b.getBookingTime() != null) {
                        LocalDate d = b.getBookingTime().toLocalDate();
                        if (!d.isBefore(weekStart) && !d.isAfter(weekEnd)) {
                            weekRevenue = weekRevenue.add(b.getTotalAmount());
                        }
                    }
                }
                chartData.add(Map.of(
                    "label",   "T" + (w == 0 ? "uần này" : (4 - w)),
                    "amount",  weekRevenue,
                    "tickets", countTicketsInRange(allBookings, weekStart, weekEnd)
                ));
            }
        } else {
            // 7 ngày gần nhất (daily)
            for (int d = 6; d >= 0; d--) {
                LocalDate day = LocalDate.now().minusDays(d);
                BigDecimal dayRevenue = BigDecimal.ZERO;
                for (Booking b : allBookings) {
                    if ("PAID".equals(b.getPaymentStatus()) && b.getBookingTime() != null
                            && b.getBookingTime().toLocalDate().equals(day)) {
                        dayRevenue = dayRevenue.add(b.getTotalAmount());
                    }
                }
                chartData.add(Map.of(
                    "label",   day.format(fmt),
                    "amount",  dayRevenue,
                    "tickets", countTicketsInRange(allBookings, day, day)
                ));
            }
        }

        return ResponseEntity.ok(chartData);
    }

    private long countTicketsInRange(List<Booking> bookings, LocalDate from, LocalDate to) {
        return bookings.stream()
            .filter(b -> "PAID".equals(b.getPaymentStatus()) && b.getBookingTime() != null)
            .filter(b -> {
                LocalDate d = b.getBookingTime().toLocalDate();
                return !d.isBefore(from) && !d.isAfter(to);
            })
            .count();
    }
}
