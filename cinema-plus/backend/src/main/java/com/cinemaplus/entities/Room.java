package com.cinemaplus.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Rooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    @ManyToOne
    @JoinColumn(name = "cinema_id", nullable = false)
    private Cinema cinema;

    @Column(length = 20)
    private String status = "AVAILABLE"; // AVAILABLE, MAINTENANCE
}