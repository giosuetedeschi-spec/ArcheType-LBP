package com.archetype.lbp.repository;

import com.archetype.lbp.model.Backlog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BacklogRepository extends JpaRepository<Backlog, Long> {

    List<Backlog> findByUser_Id(Long userId);

    List<Backlog> findByUser_IdAndStatus(Long userId, String status);

    boolean existsByUser_IdAndGame_Id(Long userId, Long gameId);

    @Modifying
    @Query("DELETE FROM Backlog b WHERE b.user.id = :userId AND b.game.id = :gameId")
    void deleteByUserIdAndGameId(@Param("userId") Long userId, @Param("gameId") Long gameId);
}
