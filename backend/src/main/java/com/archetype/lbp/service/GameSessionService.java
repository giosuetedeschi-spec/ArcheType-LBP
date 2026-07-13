package com.archetype.lbp.service;

import com.archetype.lbp.model.Game;
import com.archetype.lbp.model.GameSession;
import com.archetype.lbp.model.User;

import com.archetype.lbp.dto.GameSessionEndRequest;
import com.archetype.lbp.dto.GameSessionRequest;
import com.archetype.lbp.dto.GameSessionResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.GameRepository;
import com.archetype.lbp.repository.GameSessionRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service per la gestione delle sessioni di gioco.
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class GameSessionService {

    private final GameSessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    /**
     * Lista le sessioni di un utente, eventualmente filtrate per gioco.
     * @return lista di sessioni ordinate per data di inizio (più recenti prima)
     */
    @Transactional(readOnly = true)
    public List<GameSessionResponse> list(Long userId, Long gameId) {
        validateUser(userId);
        List<GameSession> sessions = gameId != null
                ? sessionRepo.findByUser_IdAndGame_Id(userId, gameId)
                : sessionRepo.findByUser_IdOrderBySessionStartDesc(userId);
        return sessions.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Avvia una nuova sessione di gioco per un utente.
     * @return la sessione creata
     */
    public GameSessionResponse start(Long userId, GameSessionRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Game game = gameRepo.findById(req.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", req.getGameId()));

        GameSession session = new GameSession();
        session.setUser(user);
        session.setGame(game);
        session.setSessionStart(req.getSessionStart() != null ? req.getSessionStart() : LocalDateTime.now());
        return toResponse(sessionRepo.save(session));
    }

    /**
     * Termina una sessione di gioco in corso, calcolando la durata.
     * @return la sessione aggiornata con data di fine e durata
     * @throws IllegalArgumentException se la sessione è già terminata o se sessionEnd è prima di sessionStart
     */
    public GameSessionResponse end(Long userId, Long id, GameSessionEndRequest req) {
        GameSession session = sessionRepo.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("GameSession", "id", id));
        if (session.getSessionEnd() != null) {
            throw new IllegalArgumentException("Session already ended");
        }

        LocalDateTime end = req.getSessionEnd() != null ? req.getSessionEnd() : LocalDateTime.now();
        if (end.isBefore(session.getSessionStart())) {
            throw new IllegalArgumentException("sessionEnd cannot be before sessionStart");
        }

        session.setSessionEnd(end);
        session.setDurationMin((int) Duration.between(session.getSessionStart(), end).toMinutes());
        return toResponse(sessionRepo.save(session));
    }

    /** Elimina una sessione di gioco. */
    public void delete(Long userId, Long id) {
        GameSession session = sessionRepo.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("GameSession", "id", id));
        sessionRepo.delete(session);
    }

    /** Verifica che l'utente esista, lancia ResourceNotFoundException se non esiste. */
    private void validateUser(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
    }

    /** Converte una entity GameSession nel DTO GameSessionResponse. */
    private GameSessionResponse toResponse(GameSession session) {
        GameSessionResponse r = new GameSessionResponse();
        r.setId(session.getId());
        r.setUserId(session.getUser().getId());
        r.setSessionStart(session.getSessionStart());
        r.setSessionEnd(session.getSessionEnd());
        r.setDurationMin(session.getDurationMin());
        r.setCreatedAt(session.getCreatedAt());

        GameSessionResponse.GameSummary game = new GameSessionResponse.GameSummary();
        game.setId(session.getGame().getId());
        game.setName(session.getGame().getName());
        game.setHeaderImageUrl(session.getGame().getHeaderImageUrl());
        r.setGame(game);

        return r;
    }
}
