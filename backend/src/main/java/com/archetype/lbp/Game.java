package com.archetype.lbp;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "games")
public class Game {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "steam_app_id", unique = true)
    private Integer steamAppId;

    @Column(nullable = false)
    private String name;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    private String developer;
    private String publisher;

    private BigDecimal price;

    private BigDecimal rating;

    private String genres;
    private String description;

    @Column(name = "header_image_url")
    private String headerImageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
