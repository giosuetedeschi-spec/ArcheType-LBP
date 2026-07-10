package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.UserGameRequest;
import com.archetype.lbp.dto.UserGameResponse;
import com.archetype.lbp.service.UserGameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/games")
@RequiredArgsConstructor
public class UserGameController {

    private static final Logger log = LoggerFactory.getLogger(UserGameController.class);

    private final UserGameService userGameService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserGameResponse>>> list(
            @PathVariable Long userId,
            @RequestParam(required = false) String status) {
        List<UserGameResponse> result = (status != null)
                ? userGameService.getUserGamesByStatus(userId, status)
                : userGameService.getUserGames(userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Aggiunge un gioco alla libreria dell'utente.
     * Issue #15: aggiunto log INFO per tracciare l'aggiunta riuscita.
     *
     * @param userId ID dell'utente
     * @param req dati del gioco da aggiungere
     * @return ResponseEntity con il gioco aggiunto e status 201
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserGameResponse>> add(
            @PathVariable Long userId,
            @Valid @RequestBody UserGameRequest req) {
        UserGameResponse response = userGameService.addGame(userId, req);
        log.info("Game added to library - UserID: {}, GameID: {}, UserGameID: {}", userId, req.getGameId(), response.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Game added to library"));
    }

    /**
     * Aggiorna lo stato di un gioco nella libreria dell'utente.
     * Issue #15: aggiunto log INFO per tracciare l'aggiornamento riuscito.
     *
     * @param userId ID dell'utente
     * @param id ID del UserGame da aggiornare
     * @param req dati aggiornati del gioco
     * @return ResponseEntity con il gioco aggiornato
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserGameResponse>> update(
            @PathVariable Long userId,
            @PathVariable Long id,
            @Valid @RequestBody UserGameRequest req) {
        UserGameResponse response = userGameService.update(userId, id, req);
        log.info("UserGame status updated - UserID: {}, UserGameID: {}", userId, id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Status updated"));
    }

    /**
     * Rimuove un gioco dalla libreria dell'utente.
     * Issue #15: aggiunto log INFO per tracciare la rimozione riuscita.
     *
     * @param userId ID dell'utente
     * @param id ID del UserGame da rimuovere
     * @return ResponseEntity con status 200
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable Long userId, @PathVariable Long id) {
        userGameService.removeGame(userId, id);
        log.info("Game removed from library - UserID: {}, UserGameID: {}", userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Game removed from library"));
    }
}