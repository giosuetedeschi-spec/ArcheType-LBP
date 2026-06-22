package com.archetype.lbp.service;

import com.archetype.lbp.Game;
import com.archetype.lbp.User;
import com.archetype.lbp.UserGame;
import com.archetype.lbp.repository.GameRepository;
import com.archetype.lbp.repository.UserGameRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @RequiredArgsConstructor
@Transactional
public class UserGameService {
    private final UserGameRepository userGameRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    public List<UserGame> getUserGames(Long userId) { return userGameRepo.findByUserId(userId); }
    public List<UserGame> getUserGamesByStatus(Long userId, String status) {
        return userGameRepo.findByUserIdAndStatus(userId, status);
    }

    public UserGame addGame(Long userId, Long gameId, String status) {
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Game game = gameRepo.findById(gameId).orElseThrow(() -> new RuntimeException("Game not found"));
        UserGame ug = new UserGame();
        ug.setUser(user);
        ug.setGame(game);
        ug.setStatus(status != null ? status : "wishlist");
        return userGameRepo.save(ug);
    }

    public UserGame updateStatus(Long userId, Long id, String status) {
        UserGame ug = userGameRepo.findById(id).orElseThrow(() -> new RuntimeException("UserGame not found"));
        ug.setStatus(status);
        return userGameRepo.save(ug);
    }

    public void removeGame(Long userId, Long gameId) {
        userGameRepo.deleteByUserIdAndGameId(userId, gameId);
    }
}
