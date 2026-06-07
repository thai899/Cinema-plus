package com.cinemaplus.controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.cinemaplus.entities.Showtime;
import com.cinemaplus.entities.Ticket;
import com.cinemaplus.entities.TicketStatus;
import com.cinemaplus.repositories.ShowtimeRepository;
import com.cinemaplus.repositories.TicketRepository;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:5173")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * GET /api/staff/showtimes/today
     * Trả về danh sách suất chiếu trong ngày cùng số lượng vé đã soát
     */
    @GetMapping("/showtimes/today")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getTodayShowtimes() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);

        List<Showtime> todayShowtimes = showtimeRepository
                .findByStartTimeBetweenOrderByStartTimeAsc(startOfDay, endOfDay);

        List<Map<String, Object>> result = todayShowtimes.stream().map(st -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id",          st.getId());
            map.put("startTime",   st.getStartTime().toString());
            map.put("endTime",     st.getEndTime().toString());
            map.put("movieTitle",  st.getMovie().getTitle());
            map.put("movieFormat", st.getMovie().getFormat());
            map.put("screenName",  st.getScreen().getName());
            map.put("basePrice",   st.getBasePrice());

            // Đếm vé đã xác nhập (USED) trong suất này
            long usedCount = ticketRepository.findAll().stream()
                    .filter(t -> st.getId().equals(t.getShowtimeId())
                             && t.getStatus() == TicketStatus.USED)
                    .count();
            map.put("scannedCount", usedCount);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify-ticket")
    public ResponseEntity<?> verifyTicket(@RequestBody Map<String, Object> request) {
        String qrData = (String) request.get("qrData");
        Long currentShowtimeId = Long.valueOf(request.get("currentShowtimeId").toString());

        Optional<Ticket> ticketOpt = ticketRepository.findByQrCodeString(qrData);

        // Trường hợp 1: Mã QR lạ không khớp dữ liệu hệ thống
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID", "message", "Vé giả mạo hoặc sai rạp!"));
        }

        Ticket ticket = ticketOpt.get();

        // Trường hợp 2: Vé thật nhưng lệch suất chiếu đang chọn soát tại cổng
        if (!ticket.getShowtimeId().equals(currentShowtimeId)) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID", "message", "Vé sai cổng hoặc sai suất chiếu!"));
        }

        // Trường hợp 3: Đơn hàng chưa thanh toán — KHÔNG cho vào
        if (ticket.getBooking() != null && !"PAID".equals(ticket.getBooking().getPaymentStatus())) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID", "message", "Vé thuộc đơn hàng chưa hoàn tất thanh toán!"));
        }

        // Trường hợp 4: Vé đã quét vào cửa từ trước (Chống quay vòng vé)
        if (ticket.getStatus() == TicketStatus.USED) {
            return ResponseEntity.badRequest().body(Map.of("status", "USED", "message", "Cảnh báo: Vé này đã được sử dụng trước đó!"));
        }

        // Trường hợp 4: Vé chuẩn hoàn toàn
        ticket.setStatus(TicketStatus.USED);
        ticket.setScannedAt(LocalDateTime.now());
        ticketRepository.save(ticket); // Cập nhật trạng thái xuống database luôn

        Map<String, Object> responseData = Map.of(
            "status", "VALID",
            "message", "Vé hợp lệ - Mời vào cửa",
            "ticketId", ticket.getId()
        );

        // Phát tín hiệu qua Socket thông báo ca trực đã soát thêm 1 vé thành công
        messagingTemplate.convertAndSend("/topic/tickets", responseData);

        return ResponseEntity.ok(responseData);
    }
}