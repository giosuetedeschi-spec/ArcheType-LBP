package com.archetype.lbp.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserStatsResponse {
    private long totalGames;
    private long wishlistCount;
    private long playingCount;
    private long finishedCount;
    private long abandonedCount;
    private Map<String, Long> gamesByGenre;
    private Map<String, Long> gamesByDeveloper;
    private Map<String, Long> gamesByYear;
    private Double averageRating;
    private Double totalSpent;
}
