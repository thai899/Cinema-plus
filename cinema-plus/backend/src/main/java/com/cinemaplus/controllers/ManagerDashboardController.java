package com.cinemaplus.controllers;

import com.cinemaplus.repositories.BookingRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager")
public class ManagerDashboardController {

    private final BookingRepository bookingRepository;

    public ManagerDashboardController(
            BookingRepository bookingRepository
    ){
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/total-revenue")
    public Double revenue(){

        return bookingRepository
                .sumRevenue();
    }
}