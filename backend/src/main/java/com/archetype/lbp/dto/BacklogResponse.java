package com.archetype.lbp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BacklogResponse {
    private Long id;
    private Long userId;
    private GameSummary game;
    private String status;
    private Integer playTimeMin;
    private String notes;
    private LocalDateTime addedAt;
    private LocalDateTime updatedAt;

    @Data
    public static class GameSummary {
        private Long id;
        private String name;
        private String headerImageUrl;
        private String developer;
    }
}
