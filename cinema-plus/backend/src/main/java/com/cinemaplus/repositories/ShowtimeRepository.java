package com.cinemaplus.repositories;

import com.cinemaplus.entities.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    java.util.List<Showtime> findByMovieIdOrderByStartTimeAsc(Long movieId);
}
