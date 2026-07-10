package com.archetype.lbp.controller;

import com.archetype.lbp.dto.*;
import com.archetype.lbp.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private static final Logger log = LoggerFactory.getLogger(GameController.class);
    
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

    /**
     * Crea un nuovo gioco.
     * Issue #15: aggiunto log INFO per tracciare la creazione riuscita.
     * 
     * @param req dati del gioco da creare
     * @return ResponseEntity con il gioco creato e status 201
     */
    @PostMapping
    public ResponseEntity<ApiResponse<GameResponse>> create(@Valid @RequestBody GameRequest req) {
        GameResponse response = gameService.create(req);
        log.info("Game created successfully - ID: {}, Name: {}", response.getId(), response.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Gioco creato"));
    }

    /**
     * Aggiorna un gioco esistente.
     * Issue #15: aggiunto log INFO per tracciare l'aggiornamento riuscito.
     * 
     * @param id ID del gioco da aggiornare
     * @param req dati aggiornati del gioco
     * @return ResponseEntity con il gioco aggiornato
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GameResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody GameRequest req) {
        GameResponse response = gameService.update(id, req);
        log.info("Game updated successfully - ID: {}", id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Gioco aggiornato"));
    }

    /**
     * Elimina un gioco.
     * Issue #15: aggiunto log INFO per tracciare l'eliminazione riuscita.
     * 
     * @param id ID del gioco da eliminare
     * @return ResponseEntity con status 200
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        gameService.delete(id);
        log.info("Game deleted successfully - ID: {}", id);
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