package com.archetype.lbp.repository;

import com.archetype.lbp.model.Publisher;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link Publisher}.
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Repository
public interface PublisherRepository extends JpaRepository<Publisher, Long> {
    
    /** Trova un publisher tramite il suo nome esatto (case-sensitive). */
    Optional<Publisher> findByName(String name);
}
