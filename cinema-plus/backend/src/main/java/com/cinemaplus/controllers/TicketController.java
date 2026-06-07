package com.cinemaplus.controllers;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinemaplus.entities.Ticket;
import com.cinemaplus.repositories.TicketRepository;
import com.cinemaplus.entities.TicketStatus;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:5173")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Đối tượng dùng để đẩy socket sang UI

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