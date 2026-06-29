package com.archetype.lbp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String avatarUrl;

    @Pattern(regexp = "^(online|offline|busy|away)?$", message = "Status must be one of: online, offline, busy, away")
    private String status;

    @Size(max = 500, message = "Bio must be under 500 characters")
    private String bio;
}
