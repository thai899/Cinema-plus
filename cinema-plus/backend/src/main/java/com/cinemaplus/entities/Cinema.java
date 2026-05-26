package com.cinemaplus.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Cinemas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Cinema {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, length = 50)
    private String city;
}