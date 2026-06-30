package com.archetype.lbp.repository;

import com.archetype.lbp.model.UserGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserGameRepository extends JpaRepository<UserGame, Long> {
    List<UserGame> findByUser_Id(Long userId);
    List<UserGame> findByUser_IdAndStatus(Long userId, String status);
    boolean existsByUser_IdAndGame_Id(Long userId, Long gameId);
    Optional<UserGame> findByIdAndUser_Id(Long id, Long userId);

    // FIX: la cancellazione deve avvenire per id della riga UserGame,
    // non per gameId (il controller passa l'id della riga UserGame nel
    // path, non l'id del gioco). Il vecchio metodo deleteByUserIdAndGameId
    // interpretava erroneamente quell'id come gameId.
    @Modifying
    @Query("DELETE FROM UserGame ug WHERE ug.id = :id AND ug.user.id = :userId")
    void deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
