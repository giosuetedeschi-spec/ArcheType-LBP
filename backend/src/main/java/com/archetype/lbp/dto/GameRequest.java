package com.archetype.lbp.dto;

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

    private Long developerId;

    private Long publisherId;

    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    private BigDecimal price;

    @DecimalMin(value = "0.00")
    @DecimalMax(value = "5.00")
    private BigDecimal rating;

    private String description;

    private String headerImageUrl;

    private Boolean multiplayer;
}
