package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.GameRequest;
import com.archetype.lbp.dto.GameResponse;
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

    @GetMapping
    public ResponseEntity<ApiResponse<List<GameResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(gameService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GameResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GameResponse>> create(@Valid @RequestBody GameRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(gameService.create(req), "Game created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GameResponse>> update(@PathVariable Long id, @Valid @RequestBody GameRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.update(id, req), "Game updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        gameService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Game deleted"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<GameResponse>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.search(q)));
    }

    @GetMapping("/genre/{genre}")
    public ResponseEntity<ApiResponse<List<GameResponse>>> byGenre(@PathVariable String genre) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.byGenre(genre)));
    }
}
