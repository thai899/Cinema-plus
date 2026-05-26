package com.cinemaplus.dtos.requests;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank @Size(min = 3, max = 50)
    private String username;

    @NotBlank @Size(max = 100) @Email
    private String email;

    @NotBlank @Size(min = 6, max = 40)
    private String password;

    /** Expected values: admin | manager | staff | customer */
    private String role;
}
