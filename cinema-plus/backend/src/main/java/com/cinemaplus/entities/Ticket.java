package com.cinemaplus.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String qrCodeString; // Mã hash của QR để đối chiếu
    private Long showtimeId;     // Gắn với ID suất chiếu

    @Enumerated(EnumType.STRING)
    private TicketStatus status; // VALID, INVALID, USED

    private LocalDateTime scannedAt;
}

