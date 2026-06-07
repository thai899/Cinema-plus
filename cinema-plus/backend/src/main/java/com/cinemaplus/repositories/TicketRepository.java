package com.cinemaplus.repositories;

import com.cinemaplus.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Tìm vé bằng mã QR để soát vé tại quầy
    Optional<Ticket> findByQrCodeString(String qrCodeString);

    List<Ticket> findByShowtimeId(Long showtimeId);

    // Lấy tất cả vé của một booking kèm thông tin ghế
    @Query("SELECT t FROM Ticket t LEFT JOIN FETCH t.seat WHERE t.booking.id = :bookingId")
    List<Ticket> findByBookingIdWithSeat(Long bookingId);
}