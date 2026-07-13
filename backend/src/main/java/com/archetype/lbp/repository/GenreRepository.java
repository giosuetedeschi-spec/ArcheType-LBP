package com.archetype.lbp.repository;

import com.archetype.lbp.model.Genre;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link Genre}.
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Repository
public interface GenreRepository extends JpaRepository<Genre, Long> {
    
    /** Trova un genere tramite il suo nome esatto (case-sensitive). */
    Optional<Genre> findByName(String name);
}