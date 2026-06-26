package com.archetype.lbp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserGameRequest {
    @NotNull(message = "Game ID is required")
    private Long gameId;

    @Pattern(regexp = "wishlist|playing|finished|abandoned", message = "Status must be: wishlist, playing, finished, or abandoned")
    private String status;
}
