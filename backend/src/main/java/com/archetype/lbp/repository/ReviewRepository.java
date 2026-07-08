package com.archetype.lbp.repository;

import com.archetype.lbp.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByGame_IdOrderByCreatedAtDesc(Long gameId);
    List<Review> findByUser_IdOrderByCreatedAtDesc(Long userId);
    Optional<Review> findByUser_IdAndGame_Id(Long userId, Long gameId);
    Optional<Review> findByIdAndUser_Id(Long id, Long userId);
}
