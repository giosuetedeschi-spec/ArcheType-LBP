package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.UserGameRequest;
import com.archetype.lbp.dto.UserGameResponse;
import com.archetype.lbp.service.UserGameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/games")
@RequiredArgsConstructor
public class UserGameController {
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

    @PostMapping
    public ResponseEntity<ApiResponse<UserGameResponse>> add(
            @PathVariable Long userId,
            @Valid @RequestBody UserGameRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(userGameService.addGame(userId, req), "Game added to library"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserGameResponse>> update(
            @PathVariable Long userId,
            @PathVariable Long id,
            @Valid @RequestBody UserGameRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(userGameService.update(userId, id, req), "Status updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable Long userId, @PathVariable Long id) {
        userGameService.removeGame(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Game removed from library"));
    }
}
