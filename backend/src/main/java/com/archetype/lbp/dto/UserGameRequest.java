package com.archetype.lbp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

// gameId non è @NotNull qui: questo DTO è condiviso da add (dove serve,
// controllato esplicitamente in UserGameService.addGame) e da update (dove
// non ha senso richiederlo — si cambia solo status/playTimeMin/notes di una
// voce già esistente, il gioco collegato non è riassegnabile).
@Data
public class UserGameRequest {
    private Long gameId;

    @Pattern(regexp = "wishlist|playing|finished|abandoned", message = "Status must be: wishlist, playing, finished, or abandoned")
    private String status;

    @Min(value = 0, message = "playTimeMin must be >= 0")
    private Integer playTimeMin;

    @Size(max = 2000, message = "notes must be at most 2000 characters")
    private String notes;
}
