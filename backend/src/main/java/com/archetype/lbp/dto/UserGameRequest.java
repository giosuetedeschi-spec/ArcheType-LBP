package com.archetype.lbp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserGameRequest {
    @NotNull(message = "Game ID is required")
    private Long gameId;

    @Pattern(regexp = "wishlist|playing|finished|abandoned", message = "Status must be: wishlist, playing, finished, or abandoned")
    private String status;

    @Min(value = 0, message = "playTimeMin must be >= 0")
    private Integer playTimeMin;

    @Size(max = 2000, message = "notes must be at most 2000 characters")
    private String notes;
}
