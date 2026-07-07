package com.archetype.lbp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GameSessionRequest {
    @NotNull(message = "Game ID is required")
    private Long gameId;

    private LocalDateTime sessionStart;
}
