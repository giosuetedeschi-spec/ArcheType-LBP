package com.archetype.lbp.controller;

import com.archetype.lbp.UserGame;
import com.archetype.lbp.service.UserGameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/users/{userId}/games")
@RequiredArgsConstructor @CrossOrigin(origins = "*")
public class UserGameController {
    private final UserGameService userGameService;

    @GetMapping
    public List<UserGame> list(@PathVariable Long userId) { return userGameService.getUserGames(userId); }

    @PostMapping
    public UserGame add(@PathVariable Long userId, @RequestBody Map<String, Object> body) {
        Long gameId = Long.valueOf(body.get("gameId").toString());
        String status = (String) body.getOrDefault("status", "wishlist");
        return userGameService.addGame(userId, gameId, status);
    }

    @PutMapping("/{id}")
    public UserGame update(@PathVariable Long userId, @PathVariable Long id, @RequestBody Map<String, String> body) {
        return userGameService.updateStatus(userId, id, body.get("status"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long userId, @PathVariable Long id) {
        userGameService.removeGame(userId, id);
        return ResponseEntity.ok().build();
    }
}
