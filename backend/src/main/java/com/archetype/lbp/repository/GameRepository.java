package com.archetype.lbp.repository;

import com.archetype.lbp.Game;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long>, JpaSpecificationExecutor<Game> {
    Game findByAppid(Integer appid);

    static Specification<Game> withFilters(String name, String genre, String developer,
                                            BigDecimal minPrice, BigDecimal maxPrice,
                                            BigDecimal minRating, LocalDate releasedAfter,
                                            LocalDate releasedBefore) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (name != null && !name.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            if (genre != null && !genre.isBlank()) {
                predicates.add(cb.equal(root.join("genres").get("name"), genre));
            }
            if (developer != null && !developer.isBlank()) {
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
