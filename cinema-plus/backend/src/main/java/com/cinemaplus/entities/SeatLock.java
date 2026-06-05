package com.cinemaplus.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "SeatLocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeatLock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="showtime_id")
    private Long showtimeId;

    @Column(name="seat_id")
    private Long seatId;

    @Column(name="user_id")
    private Long userId;

    @Column(name="locked_at")
    private LocalDateTime lockedAt;

    @Column(name="expires_at")
    private LocalDateTime expiresAt;
}