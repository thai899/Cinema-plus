package com.cinemaplus.services;

import com.cinemaplus.entities.SeatLock;
import com.cinemaplus.repositories.SeatLockRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class SeatLockService {

    private final SeatLockRepository repository;

    public SeatLockService(
            SeatLockRepository repository
    ){
        this.repository = repository;
    }

    public boolean lockSeat(
            Long showtimeId,
            Long seatId,
            Long userId
    ){

        var existing =
                repository.findByShowtimeIdAndSeatId(
                        showtimeId,
                        seatId
                );

        if(existing.isPresent()){

            if(existing.get()
                    .getExpiresAt()
                    .isAfter(LocalDateTime.now())){

                return false;
            }

            repository.delete(existing.get());
        }

        SeatLock lock = new SeatLock();

        lock.setShowtimeId(showtimeId);
        lock.setSeatId(seatId);
        lock.setUserId(userId);

        lock.setLockedAt(LocalDateTime.now());

        lock.setExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );

        repository.save(lock);

        return true;
    }
}