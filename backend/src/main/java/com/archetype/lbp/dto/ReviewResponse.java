package com.archetype.lbp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long gameId;
    // Nome e copertina del gioco recensito — comodi qui per evitare una
    // chiamata separata a GET /games/{id} quando si mostra "le mie
    // recensioni" nel profilo (vedi ProfilePage.tsx).
    private String gameName;
    private String gameHeaderImageUrl;
    private Long userId;
    private String username;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
