package com.archetype.lbp.repository;

import com.archetype.lbp.model.UserGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link UserGame} (libreria giochi utente).
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Repository
public interface UserGameRepository extends JpaRepository<UserGame, Long> {
    
    /** Trova tutti i giochi nella libreria di un utente. */
    List<UserGame> findByUser_Id(Long userId);
    
    /** Trova tutti i giochi nella libreria di un utente con uno specifico stato. */
    List<UserGame> findByUser_IdAndStatus(Long userId, String status);
    
    /** Verifica se un utente ha già un gioco nella sua libreria. */
    boolean existsByUser_IdAndGame_Id(Long userId, Long gameId);
    
    /** Trova una specifica entry UserGame tramite ID e ID utente (per sicurezza). */
    Optional<UserGame> findByIdAndUser_Id(Long id, Long userId);

    /**
     * Elimina una entry UserGame tramite il suo ID e ID utente.
     * Fix: il vecchio metodo interpretava erroneamente l'ID UserGame come gameId.
     */
    @Modifying
    @Query("DELETE FROM UserGame ug WHERE ug.id = :id AND ug.user.id = :userId")
    void deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * Calcola il tempo di gioco totale (in minuti) per ogni utente.
     * Usato per la leaderboard globale (evita N+1).
     * @return lista di array [userId, totalPlayTimeMin]
     */
    @Query("SELECT ug.user.id, COALESCE(SUM(ug.playTimeMin), 0) FROM UserGame ug GROUP BY ug.user.id")
    List<Object[]> sumPlayTimeMinByUser();

    /**
     * Conta i giochi posseduti (esclusa wishlist) per ogni utente.
     * Usato per le statistiche della leaderboard.
     * @return lista di array [userId, ownedGamesCount]
     */
    @Query("SELECT ug.user.id, COUNT(ug) FROM UserGame ug WHERE ug.status <> 'wishlist' GROUP BY ug.user.id")
    List<Object[]> countOwnedByUser();
}