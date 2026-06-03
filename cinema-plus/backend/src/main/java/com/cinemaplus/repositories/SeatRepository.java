package com.cinemaplus.repositories;

import com.cinemaplus.entities.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByScreenId(Long screenId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Seat s WHERE s.screen.id = :screenId")
    void deleteByScreenId(Long screenId);
}
