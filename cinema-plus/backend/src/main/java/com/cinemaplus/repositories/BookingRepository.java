package com.cinemaplus.repositories;

import com.cinemaplus.entities.Booking;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface BookingRepository
        extends JpaRepository<Booking,Long> {

    @Query("""
        SELECT COALESCE(SUM(b.totalAmount),0)
        FROM Booking b
        WHERE b.paymentStatus='PAID'
    """)
    Double sumRevenue();
}