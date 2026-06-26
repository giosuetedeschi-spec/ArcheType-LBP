package com.archetype.lbp.repository;

import com.archetype.lbp.Friend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findByUserIdAndStatus(Long userId, String status);
    boolean existsByUserIdAndFriendId(Long userId, Long friendId);
}
