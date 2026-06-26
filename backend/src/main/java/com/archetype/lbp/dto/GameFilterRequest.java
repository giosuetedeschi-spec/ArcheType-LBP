package com.archetype.lbp.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

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
    private String sortBy = "name";
    private String sortDir = "asc";
    private int page = 0;
    private int size = 20;
}
