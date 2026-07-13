package com.archetype.lbp.repository;

import com.archetype.lbp.model.Friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link Friend} (relazioni di amicizia).
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    
    /** Trova tutte le relazioni di amicizia di un utente con uno specifico stato. */
    List<Friend> findByUser_IdAndStatus(Long userId, String status);

    /**
     * Trova le richieste di amicizia RICEVUTE da un utente (dove l'utente è il destinatario).
     * Vedi nota in FriendService.getPending().
     */
    List<Friend> findByFriend_IdAndStatus(Long friendId, String status);

    /** Verifica se esiste una relazione di amicizia tra due utenti. */
    boolean existsByUser_IdAndFriend_Id(Long userId, Long friendId);
    
    /** Trova una specifica relazione di amicizia tra due utenti. */
    Optional<Friend> findByUser_IdAndFriend_Id(Long userId, Long friendId);

    /**
     * Conta il numero di amicizie accettate per ogni utente.
     * Usato per la leaderboard (metrica "friends").
     * @return lista di array [userId, numeroAmiciAccettati]
     */
    @Query("SELECT f.user.id, COUNT(f) FROM Friend f WHERE f.status = 'accepted' GROUP BY f.user.id")
    List<Object[]> countAcceptedByUser();
}