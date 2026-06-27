package com.archetype.lbp.service;

import com.archetype.lbp.model.Backlog;
import com.archetype.lbp.model.Game;
import com.archetype.lbp.model.User;

import com.archetype.lbp.*;
import com.archetype.lbp.dto.*;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BacklogService {
    private final BacklogRepository backlogRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    private static final String[] VALID_STATUSES = {"wishlist", "playing", "finished", "abandoned"};

    @Transactional(readOnly = true)
    public List<BacklogResponse> getUserGames(Long userId) {
        validateUser(userId);
        return backlogRepo.findByUser_Id(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BacklogResponse> getUserGamesByStatus(Long userId, String status) {
        validateUser(userId);
        validateStatus(status);
        return backlogRepo.findByUser_IdAndStatus(userId, status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public BacklogResponse addGame(Long userId, BacklogRequest req) {
        validateUser(userId);
        validateStatus(req.getStatus());
        Game game = gameRepo.findById(req.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", req.getGameId()));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (backlogRepo.existsByUser_IdAndGame_Id(userId, req.getGameId())) {
            throw new IllegalArgumentException("Game already in user's backlog");
        }

        Backlog b = new Backlog();
        b.setUser(user);
        b.setGame(game);
        b.setStatus(req.getStatus() != null ? req.getStatus() : "wishlist");
        b.setPlayTimeMin(req.getPlayTimeMin() != null ? req.getPlayTimeMin() : 0);
        b.setNotes(req.getNotes());
        return toResponse(backlogRepo.save(b));
    }

    public BacklogResponse updateStatus(Long userId, Long id, String status) {
        validateStatus(status);
        Backlog b = backlogRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Backlog", "id", id));
        if (!b.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Backlog does not belong to this user");
        }
        b.setStatus(status);
        return toResponse(backlogRepo.save(b));
    }

    public void removeGame(Long userId, Long gameId) {
        validateUser(userId);
        backlogRepo.deleteByUserIdAndGameId(userId, gameId);
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

    private BacklogResponse toResponse(Backlog b) {
        BacklogResponse r = new BacklogResponse();
        r.setId(b.getId());
        r.setUserId(b.getUser().getId());
        r.setStatus(b.getStatus());
        r.setPlayTimeMin(b.getPlayTimeMin());
        r.setNotes(b.getNotes());
        r.setAddedAt(b.getAddedAt());
        r.setUpdatedAt(b.getUpdatedAt());

        BacklogResponse.GameSummary game = new BacklogResponse.GameSummary();
        game.setId(b.getGame().getId());
        game.setName(b.getGame().getName());
        game.setHeaderImageUrl(b.getGame().getHeaderImageUrl());
        game.setDeveloper(b.getGame().getDeveloper() != null ? b.getGame().getDeveloper().getName() : null);
        r.setGame(game);

        return r;
    }
}
