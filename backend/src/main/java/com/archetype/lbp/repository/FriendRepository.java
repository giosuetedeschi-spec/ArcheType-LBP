package com.archetype.lbp.repository;

import com.archetype.lbp.model.Friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findByUser_IdAndStatus(Long userId, String status);
    boolean existsByUser_IdAndFriend_Id(Long userId, Long friendId);
    Optional<Friend> findByUser_IdAndFriend_Id(Long userId, Long friendId);

    // Aggregato per la leaderboard (metrica "friends"): una query GROUP BY
    // su tutti gli utenti invece di una query per utente.
    // Object[] = { userId (Long), numero amici accettati (Long) }.
    @Query("SELECT f.user.id, COUNT(f) FROM Friend f WHERE f.status = 'accepted' GROUP BY f.user.id")
    List<Object[]> countAcceptedByUser();
}
