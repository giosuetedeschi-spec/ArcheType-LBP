package com.archetype.lbp.dto;

import lombok.Data;

import java.util.List;

@Data
public class LeaderboardResponse {
    private List<LeaderboardEntryResponse> entries;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    // Posizione di chi ha fatto la richiesta (LeaderboardFilterRequest.userId),
    // calcolata sull'intera classifica — non solo sulla pagina corrente.
    private LeaderboardEntryResponse myEntry;
}
