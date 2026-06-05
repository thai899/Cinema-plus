package com.cinemaplus.repositories;

import com.cinemaplus.entities.SeatLock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SeatLockRepository
        extends JpaRepository<SeatLock,Long> {

    Optional<SeatLock> findByShowtimeIdAndSeatId(
            Long showtimeId,
            Long seatId
    );

    List<SeatLock> findByExpiresAtBefore(
            LocalDateTime time
    );
}