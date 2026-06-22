package com.archetype.lbp.service;

import com.archetype.lbp.Game;
import com.archetype.lbp.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @RequiredArgsConstructor
@Transactional
public class GameService {
    private final GameRepository gameRepo;

    public List<Game> listAll() { return gameRepo.findAll(); }

    public Game getById(Long id) {
        return gameRepo.findById(id).orElseThrow(() -> new RuntimeException("Game not found: " + id));
    }

    public Game create(Game game) { return gameRepo.save(game); }

    public Game update(Long id, Game updated) {
        Game existing = getById(id);
        existing.setName(updated.getName());
        existing.setDeveloper(updated.getDeveloper());
        existing.setPublisher(updated.getPublisher());
        existing.setPrice(updated.getPrice());
        existing.setRating(updated.getRating());
        existing.setGenres(updated.getGenres());
        existing.setDescription(updated.getDescription());
        return gameRepo.save(existing);
    }

    public void delete(Long id) { gameRepo.deleteById(id); }

    public List<Game> search(String q) { return gameRepo.findByNameContainingIgnoreCase(q); }
    public List<Game> byGenre(String genre) { return gameRepo.findByGenresContainingIgnoreCase(genre); }
}
