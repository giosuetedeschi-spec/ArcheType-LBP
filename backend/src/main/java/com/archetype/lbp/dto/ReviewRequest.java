package com.archetype.lbp.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewRequest {
    // Obbligatorio in creazione (POST /api/users/{userId}/reviews), ignorato
    // in aggiornamento (PUT .../reviews/{id}) — stesso pattern già usato in
    // UserGameRequest.gameId per lo stesso identico motivo: un DTO condiviso
    // da add e update non deve richiedere in update un campo che lì non ha senso.
    private Long gameId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;

    @Size(max = 2000, message = "Comment must be at most 2000 characters")
    private String comment;
}
