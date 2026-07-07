package com.archetype.lbp.repository;

import com.archetype.lbp.model.GameSession;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    List<GameSession> findByUser_IdOrderBySessionStartDesc(Long userId);
    List<GameSession> findByUser_IdAndGame_Id(Long userId, Long gameId);
    Optional<GameSession> findByIdAndUser_Id(Long id, Long userId);
}
