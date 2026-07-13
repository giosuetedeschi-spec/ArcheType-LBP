package com.archetype.lbp.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class GameResponse {
    private Long id;
    private Integer steamAppId;
    private String name;
    private LocalDate releaseDate;
    private String developer;
    private String publisher;
    private BigDecimal price;
    private BigDecimal rating;
    private String genres;
    private String description;
    private String headerImageUrl;
    private Boolean windows;
    private Boolean mac;
    private Boolean linux;
    private Boolean mature;
    private LocalDateTime createdAt;
}
