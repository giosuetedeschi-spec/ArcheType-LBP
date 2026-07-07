package com.archetype.lbp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GameSessionResponse {
    private Long id;
    private Long userId;
    private GameSummary game;
    private LocalDateTime sessionStart;
    private LocalDateTime sessionEnd;
    private Integer durationMin;
    private LocalDateTime createdAt;

    @Data
    public static class GameSummary {
        private Long id;
        private String name;
        private String headerImageUrl;
    }
}
