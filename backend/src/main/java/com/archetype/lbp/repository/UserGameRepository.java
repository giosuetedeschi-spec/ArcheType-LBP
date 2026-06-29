package com.archetype.lbp.repository;

import com.archetype.lbp.model.UserGame;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserGameRepository extends JpaRepository<UserGame, Long> {

    List<UserGame> findByUser_Id(Long userId);

    List<UserGame> findByUser_IdAndStatus(Long userId, String status);

    boolean existsByUser_IdAndGame_Id(Long userId, Long gameId);

    @Modifying
    @Query("DELETE FROM UserGame ug WHERE ug.user.id = :userId AND ug.game.id = :gameId")
    void deleteByUserIdAndGameId(@Param("userId") Long userId, @Param("gameId") Long gameId);
}
