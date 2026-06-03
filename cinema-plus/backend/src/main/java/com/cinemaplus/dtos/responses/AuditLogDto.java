package com.cinemaplus.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AuditLogDto {
    private String username;
    private String ipAddress;
    private String httpMethod;
    private String uri;
    private String actionName;
    private LocalDateTime timestamp = LocalDateTime.now();
    private String details;
}
