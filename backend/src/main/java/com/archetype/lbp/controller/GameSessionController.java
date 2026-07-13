package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.GameSessionEndRequest;
import com.archetype.lbp.dto.GameSessionRequest;
import com.archetype.lbp.dto.GameSessionResponse;
import com.archetype.lbp.service.GameSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/sessions")
@RequiredArgsConstructor
public class GameSessionController {

    private static final Logger log = LoggerFactory.getLogger(GameSessionController.class);

    private final GameSessionService sessionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GameSessionResponse>>> list(
            @PathVariable Long userId,
            @RequestParam(required = false) Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.list(userId, gameId)));
    }

    /**
     * Avvia una nuova sessione di gioco.
     * Issue #15: aggiunto log INFO per tracciare l'avvio riuscito.
     *
     * @param userId ID dell'utente che avvia la sessione
     * @param req dati della sessione da avviare
     * @return ResponseEntity con la sessione creata e status 201
     */
    @PostMapping
    public ResponseEntity<ApiResponse<GameSessionResponse>> start(
            @PathVariable Long userId,
            @Valid @RequestBody GameSessionRequest req) {
        GameSessionResponse response = sessionService.start(userId, req);
        log.info("Game session started - UserID: {}, SessionID: {}, GameID: {}", userId, response.getId(), req.getGameId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Session started"));
    }

    /**
     * Termina una sessione di gioco in corso.
     * Issue #15: aggiunto log INFO per tracciare la terminazione riuscita.
     *
     * @param userId ID dell'utente proprietario della sessione
     * @param id ID della sessione da terminare
     * @param req dati opzionali di chiusura sessione
     * @return ResponseEntity con la sessione aggiornata
     */
    @PatchMapping("/{id}/end")
    public ResponseEntity<ApiResponse<GameSessionResponse>> end(
            @PathVariable Long userId,
            @PathVariable Long id,
            @RequestBody(required = false) GameSessionEndRequest req) {
        GameSessionEndRequest body = req != null ? req : new GameSessionEndRequest();
        GameSessionResponse response = sessionService.end(userId, id, body);
        log.info("Game session ended - UserID: {}, SessionID: {}", userId, id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Session ended"));
    }

    /**
     * Elimina una sessione di gioco.
     * Issue #15: aggiunto log INFO per tracciare l'eliminazione riuscita.
     *
     * @param userId ID dell'utente proprietario della sessione
     * @param id ID della sessione da eliminare
     * @return ResponseEntity con status 200
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable Long userId, @PathVariable Long id) {
        sessionService.delete(userId, id);
        log.info("Game session deleted - UserID: {}, SessionID: {}", userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Session deleted"));
    }
}