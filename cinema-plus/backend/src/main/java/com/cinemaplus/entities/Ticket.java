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

    @Column(name = "qr_code_string")
    private String qrCodeString; // Mã hash của QR để đối chiếu
    
    @Column(name = "showtime_id")
    private Long showtimeId;     // Gắn với ID suất chiếu

    @Enumerated(EnumType.STRING)
    private TicketStatus status; // VALID, INVALID, USED

    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "seat_id")
    private Seat seat;

    private java.math.BigDecimal price;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "is_checked_in")
    private Boolean isCheckedIn = false;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;
}

