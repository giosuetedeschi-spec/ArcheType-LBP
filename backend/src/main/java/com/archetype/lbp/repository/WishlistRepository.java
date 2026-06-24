package com.archetype.lbp.repository;

import com.archetype.lbp.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserId(Long userId);
    void deleteByUserIdAndGameId(Long userId, Long gameId);
}
