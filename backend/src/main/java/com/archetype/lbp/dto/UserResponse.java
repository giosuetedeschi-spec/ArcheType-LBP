package com.archetype.lbp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String status;
    private String bio;
    private LocalDateTime createdAt;
}
