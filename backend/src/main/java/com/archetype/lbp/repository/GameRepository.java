package com.archetype.lbp.repository;

import com.archetype.lbp.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    Optional<Game> findBySteamAppId(Integer steamAppId);
    List<Game> findByNameContainingIgnoreCase(String name);
    List<Game> findByGenresContainingIgnoreCase(String genre);
}
