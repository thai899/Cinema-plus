package com.cinemaplus.repositories;

import com.cinemaplus.entities.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByMovieIdOrderByStartTimeAsc(Long movieId);
    List<Showtime> findByStartTimeBetweenOrderByStartTimeAsc(LocalDateTime from, LocalDateTime to);
}
