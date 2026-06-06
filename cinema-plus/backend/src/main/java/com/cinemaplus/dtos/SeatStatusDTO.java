package com.cinemaplus.dtos;

import lombok.Data;

@Data
public class SeatStatusDTO {
    private Long id;
    private String seatRow;
    private Integer seatNumber;
    private String type;
    private String status; // AVAILABLE, BOOKED, LOCKED
    private String lockedBy; // Username if locked
}
