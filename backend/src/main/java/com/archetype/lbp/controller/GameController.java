package com.archetype.lbp.controller;

import com.archetype.lbp.dto.*;
import com.archetype.lbp.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    /**
     * Catalogo con paginazione e filtri.
     * GET /api/games/filter?name=elden&genre=rpg&page=0&size=20&sortBy=rating&sortDir=desc
     *
     * Usare sempre questo endpoint invece di /api/games per evitare
     * di caricare decine di migliaia di record in memoria.
     */
    @GetMapping("/filter")
    public ResponseEntity<ApiResponse<PagedResponse<GameResponse>>> filter(GameFilterRequest filter) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.filter(filter)));
    }

    /**
     * Lista non paginata — uso interno / admin.
     * Limitata a 100 risultati per protezione.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<GameResponse>>> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        GameFilterRequest req = new GameFilterRequest();
        req.setPage(page);
        req.setSize(Math.min(size, 100)); // max 100 per chiamata
        return ResponseEntity.ok(ApiResponse.ok(gameService.filter(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GameResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GameResponse>> create(@Valid @RequestBody GameRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(gameService.create(req), "Gioco creato"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GameResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody GameRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.update(id, req), "Gioco aggiornato"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        gameService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Gioco eliminato"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<GameResponse>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.search(q, limit)));
    }

    @GetMapping("/genre/{genre}")
    public ResponseEntity<ApiResponse<List<GameResponse>>> byGenre(@PathVariable String genre) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.byGenre(genre)));
    }

    @GetMapping("/steam/{steamAppId}")
    public ResponseEntity<ApiResponse<GameResponse>> bySteamId(@PathVariable Integer steamAppId) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getBySteamAppId(steamAppId)));
    }
}
