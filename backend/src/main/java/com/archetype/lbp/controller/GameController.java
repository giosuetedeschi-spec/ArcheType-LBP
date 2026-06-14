package com.archetype.lbp.controller;

import com.archetype.lbp.Game;
import com.archetype.lbp.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/games")
@RequiredArgsConstructor @CrossOrigin(origins = "*")
public class GameController {
    private final GameService gameService;

    @GetMapping
    public List<Game> list() { return gameService.listAll(); }

    @GetMapping("/{id}")
    public Game get(@PathVariable Long id) { return gameService.getById(id); }

    @PostMapping
    public Game create(@RequestBody Game game) { return gameService.create(game); }

    @PutMapping("/{id}")
    public Game update(@PathVariable Long id, @RequestBody Game game) { return gameService.update(id, game); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { gameService.delete(id); return ResponseEntity.ok().build(); }

    @GetMapping("/search")
    public List<Game> search(@RequestParam String q) { return gameService.search(q); }
}
