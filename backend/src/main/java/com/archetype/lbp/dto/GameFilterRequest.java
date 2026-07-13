package com.archetype.lbp.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    // Se true, mostra solo giochi con supporto VR (categorie "VR Support" /
    // "VR Only" / "VR Supported" / "SteamVR Collectibles" — vedi
    // GameRepository.withFilters per l'elenco esatto).
    private Boolean vr;

    // Media delle recensioni utente (tabella reviews, scala 1-5) — distinta
    // da minRating sopra, che filtra il rating Steam del dataset, non le
    // recensioni scritte dagli utenti sulla piattaforma.
    @DecimalMin(value = "1.0", message = "minUserRating deve essere tra 1 e 5")
    @DecimalMax(value = "5.0", message = "minUserRating deve essere tra 1 e 5")
    private BigDecimal minUserRating;

    // Se false/null (default), i giochi con games.mature=true (età >= 18,
    // genere Nudity/Sexual Content, o "hentai" nel nome — vedi
    // populate_db.py) sono esclusi dai risultati. Se true, ricompaiono
    // insieme agli altri (non è un "mostra SOLO 18+" come vr, è un opt-in a
    // vederli anche) — checkbox "Mostra giochi 18+" lato UI.
    private Boolean mature;

    private String sortBy = "name";
    private String sortDir = "asc";

    @Min(value = 0, message = "page non può essere negativo")
    private int page = 0;

    @Min(value = 1, message = "size deve essere almeno 1")
    @Max(value = 100, message = "size non può superare 100")
    private int size = 20;
}
