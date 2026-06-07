package com.cinemaplus.controllers;

import com.cinemaplus.services.SeatLockService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "http://localhost:5173")
public class SeatLockController {

    private final SeatLockService service;

    public SeatLockController(
            SeatLockService service
    ){
        this.service = service;
    }

    @PostMapping("/lock-seat")
    public Map<String,Object> lockSeat(
            @RequestBody Map<String,Object> body
    ){

        boolean success =
                service.lockSeat(
                        Long.valueOf(body.get("showtimeId").toString()),
                        Long.valueOf(body.get("seatId").toString()),
                        body.get("userId").toString()
                );

        return Map.of(
                "success",
                success
        );
    }
}