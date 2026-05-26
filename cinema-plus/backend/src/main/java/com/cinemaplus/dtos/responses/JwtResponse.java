package com.cinemaplus.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class JwtResponse {
    private String token;
    private String username;
    private String role; // Trả về dạng: ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, ROLE_CUSTOMER
}
