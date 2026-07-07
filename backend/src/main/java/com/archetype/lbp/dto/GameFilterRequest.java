package com.archetype.lbp.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class GameFilterRequest {
    private String name;
    private String genre;
    private String developer;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private BigDecimal minRating;
    private LocalDate releasedAfter;
    private LocalDate releasedBefore;

    // Valori accettati: "windows" / "mac" / "linux" (case-insensitive).
    // Più valori = OR (mostra i giochi compatibili con almeno una delle
    // piattaforme selezionate), coerente con checkbox multiple lato UI.
    private List<String> os;

    private String sortBy = "name";
    private String sortDir = "asc";
    private int page = 0;
    private int size = 20;
}
