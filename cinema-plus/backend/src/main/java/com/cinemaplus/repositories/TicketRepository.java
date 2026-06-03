package com.cinemaplus.repositories;

import com.cinemaplus.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    // 🟢 Hàm tìm kiếm vé bằng chuỗi mã QR giải mã từ Client gửi lên
    Optional<Ticket> findByQrCodeString(String qrCodeString);
}