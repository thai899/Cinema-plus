package com.cinemaplus.controllers;

import com.cinemaplus.entities.Showtime;
import com.cinemaplus.repositories.ShowtimeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/showtimes")
public class ShowtimeController {

    private final ShowtimeRepository repository;

    public ShowtimeController(
            ShowtimeRepository repository
    ){
        this.repository = repository;
    }

    @GetMapping
    public List<Showtime> getAll(){
        return repository.findAll();
    }
}