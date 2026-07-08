package com.archetype.lbp.repository;

import com.archetype.lbp.model.Friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findByUser_IdAndStatus(Long userId, String status);

    // Richieste ricevute: righe dove l'utente è il DESTINATARIO (colonna
    // friend_id), non il mittente — vedi nota in FriendService.getPending().
    List<Friend> findByFriend_IdAndStatus(Long friendId, String status);

    boolean existsByUser_IdAndFriend_Id(Long userId, Long friendId);
    Optional<Friend> findByUser_IdAndFriend_Id(Long userId, Long friendId);
}
