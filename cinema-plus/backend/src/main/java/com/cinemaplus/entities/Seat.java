package com.cinemaplus.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Seats")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_row", nullable = false, length = 5)
    private String seatRow; // Ví dụ: A, B, C...

    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber; // Ví dụ: 1, 2, 3...

    @Column(length = 20)
    private String type = "NORMAL"; // NORMAL, VIP, COUPLE

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
}