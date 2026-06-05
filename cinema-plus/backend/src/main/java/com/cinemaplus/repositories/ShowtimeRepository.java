package com.cinemaplus.repositories;

import com.cinemaplus.entities.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShowtimeRepository
        extends JpaRepository<Showtime,Long> {
}