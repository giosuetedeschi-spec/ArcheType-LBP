package com.archetype.lbp.repository;

import com.archetype.lbp.model.Category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link Category}.
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    /** Trova una categoria tramite il suo nome esatto (case-sensitive). */
    Optional<Category> findByName(String name);
}
