package com.cinemaplus.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String type = "SINGLE"; // SINGLE, VIP, SWEETBOX_DOUBLE

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    @JsonIgnore
    private Screen screen;
}