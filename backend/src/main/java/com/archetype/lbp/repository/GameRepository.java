package com.archetype.lbp.repository;

import com.archetype.lbp.model.Game;
import com.archetype.lbp.model.Genre;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long>, JpaSpecificationExecutor<Game> {
    Game findBySteamAppId(Integer steamAppId);
    List<Game> findByNameContainingIgnoreCase(String name);

    // Sostituisce il vecchio findByGenresContainingIgnoreCase(String) che
    // presupponeva "genres" come stringa: ora è una relazione N:N, quindi
    // si naviga tramite la entity Genre.
    List<Game> findByGenres_NameContainingIgnoreCase(String genreName);

    // Nomi esatti (case-sensitive, così come importati da populate_db.py
    // dalla colonna "Categories" del dataset Steam) delle categorie che
    // indicano supporto VR — un gioco con almeno una di queste passa il
    // filtro vr=true.
    List<String> VR_CATEGORY_NAMES = List.of(
            "VR Support", "VR Only", "VR Supported", "SteamVR Collectibles"
    );

    static Specification<Game> withFilters(String name, String genre, String developer,
                                            BigDecimal minPrice, BigDecimal maxPrice,
                                            BigDecimal minRating, LocalDate releasedAfter,
                                            LocalDate releasedBefore, List<String> os, Boolean vr,
                                            Boolean mature) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (name != null && !name.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            if (genre != null && !genre.isBlank()) {
                // genres è ora una relazione N:N -> serve un join esplicito
                // sul nome del Genre, non più un LIKE su una colonna stringa.
                query.distinct(true);
                Join<Object, Object> genreJoin = root.join("genres", JoinType.LEFT);
                predicates.add(cb.like(cb.lower(genreJoin.get("name")), "%" + genre.toLowerCase() + "%"));
            }
            if (developer != null && !developer.isBlank()) {
                // developer è ora una relazione @ManyToOne -> filtriamo sul
                // campo "name" dell'entity Developer collegata.
                predicates.add(cb.like(cb.lower(root.get("developer").get("name")), "%" + developer.toLowerCase() + "%"));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }
            if (releasedAfter != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("releaseDate"), releasedAfter));
            }
            if (releasedBefore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("releaseDate"), releasedBefore));
            }
            if (os != null && !os.isEmpty()) {
                // OR tra le piattaforme selezionate: un gioco compatibile con
                // almeno una di quelle richieste deve comparire nel risultato.
                List<Predicate> osPredicates = new ArrayList<>();
                for (String value : os) {
                    if (value == null) continue;
                    switch (value.trim().toLowerCase()) {
                        case "windows" -> osPredicates.add(cb.isTrue(root.get("windows")));
                        case "mac" -> osPredicates.add(cb.isTrue(root.get("mac")));
                        case "linux" -> osPredicates.add(cb.isTrue(root.get("linux")));
                        default -> { }
                    }
                }
                if (!osPredicates.isEmpty()) {
                    predicates.add(cb.or(osPredicates.toArray(new Predicate[0])));
                }
            }
            if (Boolean.TRUE.equals(vr)) {
                // Stesso pattern del join su "genres" sopra: un gioco può
                // avere più categorie VR contemporaneamente, quindi serve
                // distinct per non restituirlo duplicato.
                query.distinct(true);
                Join<Object, Object> categoryJoin = root.join("categories", JoinType.LEFT);
                predicates.add(categoryJoin.get("name").in(VR_CATEGORY_NAMES));
            }

            // "mature" qui significa "includi anche i contenuti per adulti",
            // non "mostra SOLO quelli" (a differenza di vr): di default i
            // giochi con games.mature=true (età >= 18, genere Nudity/Sexual
            // Content, o "hentai" nel nome — vedi populate_db.py) restano
            // nascosti da catalogo/home/ricerche (issue #87); il chiamante
            // passa mature=true (checkbox "Mostra giochi 18+" lato UI) solo
            // per farli ricomparire, senza restringere ai soli 18+.
            if (!Boolean.TRUE.equals(mature)) {
                predicates.add(cb.isFalse(root.get("mature")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Query("SELECT g FROM Game g WHERE g.headerImageUrl IS NOT NULL AND g.headerImageUrl <> ''") 
    Page<Game> findValidGames(Pageable pageable);
}
