package com.archetype.lbp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private Integer appid;

    @Column(nullable = false)
    @NotBlank
    @Size(max = 255)
    private String name;

    @DecimalMin(value = "0.00")
    private java.math.BigDecimal price;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "developer_id")
    private Developer developer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id")
    private Publisher publisher;

    @DecimalMin(value = "0.00")
    @DecimalMax(value = "5.00")
    private java.math.BigDecimal rating;

    private String description;

    @Column(name = "header_image_url")
    @Size(max = 500)
    private String headerImageUrl;

    @Column(name = "multiplayer")
    private Boolean multiplayer = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
