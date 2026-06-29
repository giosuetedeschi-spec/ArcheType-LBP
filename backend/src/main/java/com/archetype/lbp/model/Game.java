package com.archetype.lbp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "games")
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appid", unique = true)
    @NotNull
    private Integer steamAppId;

    @Column(nullable = false)
    @NotBlank
    @Size(max = 255)
    private String name;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    // Relazione vera verso developers(id), coerente con lo schema SQL
    // normalizzato (db/init.sql). Prima era una semplice stringa: causava
    // "Schema-validation: missing column [developer]" perché il DB non
    // ha mai avuto quella colonna, ha sempre avuto developer_id.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "developer_id")
    private Developer developer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id")
    private Publisher publisher;

    @DecimalMin(value = "0.00")
    private BigDecimal price;

    @DecimalMin(value = "0.00")
    @DecimalMax(value = "5.00")
    private BigDecimal rating;

    // Relazione N:N vera verso genres, tramite la tabella ponte game_genres
    // (già presente in db/init.sql). Prima era una stringa comma-separated.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "game_genres",
            joinColumns = @JoinColumn(name = "game_id"),
            inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres = new HashSet<>();

    private String description;

    @Column(name = "header_image_url")
    @Size(max = 1000)
    private String headerImageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
