package com.archetype.lbp.repository;

import com.archetype.lbp.UserGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserGameRepository extends JpaRepository<UserGame, Long> {
    List<UserGame> findByUserId(Long userId);
    List<UserGame> findByUserIdAndStatus(Long userId, String status);
    void deleteByUserIdAndGameId(Long userId, Long gameId);
}
