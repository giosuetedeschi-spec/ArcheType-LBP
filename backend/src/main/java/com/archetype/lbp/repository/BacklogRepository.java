package com.archetype.lbp.repository;

import com.archetype.lbp.Backlog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BacklogRepository extends JpaRepository<Backlog, Long> {
    List<Backlog> findByUserId(Long userId);
    List<Backlog> findByUserIdAndStatus(Long userId, String status);
    boolean existsByUserIdAndGameId(Long userId, Long gameId);
    void deleteByUserIdAndGameId(Long userId, Long gameId);
}
