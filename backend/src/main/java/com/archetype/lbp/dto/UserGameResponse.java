package com.archetype.lbp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserGameResponse {
    private Long id;
    private Long userId;
    private GameSummary game;
    private String status;
    private LocalDateTime addedAt;
    private LocalDateTime updatedAt;

    @Data
    public static class GameSummary {
        private Long id;
        private String name;
        private String headerImageUrl;
        private String genres;
    }
}
