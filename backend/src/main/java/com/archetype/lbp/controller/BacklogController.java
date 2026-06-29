package com.archetype.lbp.controller;

import com.archetype.lbp.model.Backlog;

import com.archetype.lbp.dto.*;
import com.archetype.lbp.service.BacklogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Backlog utente — giochi con note e tempo di gioco.
 * Rotta: /api/users/{userId}/backlog
 *
 * Distinto da UserGameController (/api/users/{userId}/games) che gestisce
 * la libreria semplice (senza note, senza playtime).
 */
@RestController
@RequestMapping("/api/users/{userId}/backlog")
@RequiredArgsConstructor
public class BacklogController {

    private final BacklogService backlogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BacklogResponse>>> list(
            @PathVariable Long userId,
            @RequestParam(required = false) String status) {
        List<BacklogResponse> result = (status != null)
                ? backlogService.getUserGamesByStatus(userId, status)
                : backlogService.getUserGames(userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BacklogResponse>> add(
            @PathVariable Long userId,
            @Valid @RequestBody BacklogRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(backlogService.addGame(userId, req), "Gioco aggiunto al backlog"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BacklogResponse>> update(
            @PathVariable Long userId,
            @PathVariable Long id,
            @RequestBody BacklogRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                backlogService.updateStatus(userId, id, req.getStatus()), "Status aggiornato"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable Long userId,
            @PathVariable Long id) {
        backlogService.removeGame(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Gioco rimosso dal backlog"));
    }
}
