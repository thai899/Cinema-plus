package com.cinemaplus.dtos;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/** DTO trả về client — không lộ internal fields như likedBy list. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MovieReviewDTO {
    private String       id;
    private Long         movieId;
    private Long         userId;
    private String       username;
    private Integer      rating;
    private String       comment;
    private List<String> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer      likesCount;
    private boolean      likedByCurrentUser;   // true nếu current user đã like
    private String       status;
}

