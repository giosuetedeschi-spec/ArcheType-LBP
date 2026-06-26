package com.archetype.lbp.service;

import com.archetype.lbp.Game;
import com.archetype.lbp.User;
import com.archetype.lbp.UserGame;
import com.archetype.lbp.dto.UserGameRequest;
import com.archetype.lbp.dto.UserGameResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.GameRepository;
import com.archetype.lbp.repository.UserGameRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserGameService {
    private final UserGameRepository userGameRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    private static final String[] VALID_STATUSES = {"wishlist", "playing", "finished", "abandoned"};

    @Transactional(readOnly = true)
    public List<UserGameResponse> getUserGames(Long userId) {
        validateUser(userId);
        return userGameRepo.findByUserId(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserGameResponse> getUserGamesByStatus(Long userId, String status) {
        validateUser(userId);
        validateStatus(status);
        return userGameRepo.findByUserIdAndStatus(userId, status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public UserGameResponse addGame(Long userId, UserGameRequest req) {
        validateUser(userId);
        validateStatus(req.getStatus());
        Game game = gameRepo.findById(req.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", req.getGameId()));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (userGameRepo.existsByUserIdAndGameId(userId, req.getGameId())) {
            throw new IllegalArgumentException("Game already in user's library");
        }

        UserGame ug = new UserGame();
        ug.setUser(user);
        ug.setGame(game);
        ug.setStatus(req.getStatus() != null ? req.getStatus() : "wishlist");
        return toResponse(userGameRepo.save(ug));
    }

    public UserGameResponse updateStatus(Long userId, Long id, String status) {
        validateStatus(status);
        UserGame ug = userGameRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UserGame", "id", id));
        if (!ug.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("UserGame does not belong to this user");
        }
        ug.setStatus(status);
        return toResponse(userGameRepo.save(ug));
    }

    public void removeGame(Long userId, Long gameId) {
        validateUser(userId);
        userGameRepo.deleteByUserIdAndGameId(userId, gameId);
    }

    private void validateUser(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
    }

    private void validateStatus(String status) {
        for (String s : VALID_STATUSES) {
            if (s.equals(status)) return;
        }
        throw new IllegalArgumentException("Invalid status: '" + status + "'. Must be one of: wishlist, playing, finished, abandoned");
    }

    private UserGameResponse toResponse(UserGame ug) {
        UserGameResponse r = new UserGameResponse();
        r.setId(ug.getId());
        r.setUserId(ug.getUser().getId());
        r.setStatus(ug.getStatus());
        r.setAddedAt(ug.getAddedAt());
        r.setUpdatedAt(ug.getUpdatedAt());

        UserGameResponse.GameSummary game = new UserGameResponse.GameSummary();
        game.setId(ug.getGame().getId());
        game.setName(ug.getGame().getName());
        game.setHeaderImageUrl(ug.getGame().getHeaderImageUrl());
        game.setGenres(ug.getGame().getGenres());
        r.setGame(game);

        return r;
    }
}
