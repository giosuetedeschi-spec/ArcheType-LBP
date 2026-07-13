package com.archetype.lbp.dto;

import com.archetype.lbp.model.Game;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GameRequest {
    @NotNull(message = "Steam App ID is required")
    private Integer steamAppId;

    @NotBlank(message = "Game name is required")
    @Size(max = 255)
    private String name;

    private LocalDate releaseDate;

    @Size(max = 255)
    private String developer;

    @Size(max = 255)
    private String publisher;

    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    private BigDecimal price;

    @DecimalMin(value = "0.00")
    @DecimalMax(value = "5.00")
    private BigDecimal rating;

    private String genres;
    private String description;
    private String headerImageUrl;

    private Boolean windows = false;
    private Boolean mac = false;
    private Boolean linux = false;
    private Boolean mature = false;
}
