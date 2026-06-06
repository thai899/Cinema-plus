package com.cinemaplus.repositories;

import com.cinemaplus.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT DISTINCT b FROM Booking b " +
           "LEFT JOIN FETCH b.showtime s " +
           "LEFT JOIN FETCH s.movie " +
           "LEFT JOIN FETCH s.screen sc " +
           "LEFT JOIN FETCH sc.cinema " +
           "WHERE b.user.id = :userId " +
           "ORDER BY b.bookingTime DESC")
    List<Booking> findByUserId(Long userId);

    @Query("SELECT DISTINCT b FROM Booking b " +
           "LEFT JOIN FETCH b.showtime s " +
           "LEFT JOIN FETCH s.movie " +
           "WHERE b.paymentStatus = 'PAID'")
    List<Booking> findAllPaidWithDetails();
}
