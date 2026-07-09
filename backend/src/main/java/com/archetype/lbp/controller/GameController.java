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
     * Unico endpoint di listing (issue #100): esisteva anche un
     * GET /api/games non paginato "per uso interno/admin", ma non aveva
     * nessun consumer (né frontend né test) e /filter con i parametri di
     * default (page=0, size=20, size cappata a 100 dalla validazione su
     * GameFilterRequest) copre lo stesso caso d'uso — rimosso invece di
     * mantenere due endpoint che fanno la stessa cosa.
     */
    @GetMapping("/filter")
    public ResponseEntity<ApiResponse<PagedResponse<GameResponse>>> filter(@Valid GameFilterRequest filter) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.filter(filter)));
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
