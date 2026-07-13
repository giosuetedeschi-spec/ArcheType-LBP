package com.archetype.lbp.repository;

import com.archetype.lbp.model.Developer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link Developer} (sviluppatori di giochi)
 */
@Repository
public interface DeveloperRepository extends JpaRepository<Developer, Long> {
    
    /** Trova uno sviluppatore tramite il suo nome esatto (case-sensitive). */
    Optional<Developer> findByName(String name);
}