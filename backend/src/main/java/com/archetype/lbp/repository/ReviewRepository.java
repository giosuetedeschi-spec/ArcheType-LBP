package com.archetype.lbp.repository;

import com.archetype.lbp.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link Review} (recensioni utenti).
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    /** Trova tutte le recensioni di un gioco, ordinate per data (più recenti prima). */
    List<Review> findByGame_IdOrderByCreatedAtDesc(Long gameId);
    
    /** Trova tutte le recensioni scritte da un utente, ordinate per data (più recenti prima). */
    List<Review> findByUser_IdOrderByCreatedAtDesc(Long userId);
    
    /** Trova la recensione di un utente per un gioco specifico (al massimo una per coppia utente-gioco). */
    Optional<Review> findByUser_IdAndGame_Id(Long userId, Long gameId);
    
    /** Trova una recensione specifica tramite ID e ID utente (per sicurezza). */
    Optional<Review> findByIdAndUser_Id(Long id, Long userId);
}