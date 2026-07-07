package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.GameSessionEndRequest;
import com.archetype.lbp.dto.GameSessionRequest;
import com.archetype.lbp.dto.GameSessionResponse;
import com.archetype.lbp.service.GameSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/sessions")
@RequiredArgsConstructor
public class GameSessionController {
    private final GameSessionService sessionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GameSessionResponse>>> list(
            @PathVariable Long userId,
            @RequestParam(required = false) Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.list(userId, gameId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GameSessionResponse>> start(
            @PathVariable Long userId,
            @Valid @RequestBody GameSessionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(sessionService.start(userId, req), "Session started"));
    }

    @PatchMapping("/{id}/end")
    public ResponseEntity<ApiResponse<GameSessionResponse>> end(
            @PathVariable Long userId,
            @PathVariable Long id,
            @RequestBody(required = false) GameSessionEndRequest req) {
        GameSessionEndRequest body = req != null ? req : new GameSessionEndRequest();
        return ResponseEntity.ok(ApiResponse.ok(sessionService.end(userId, id, body), "Session ended"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable Long userId, @PathVariable Long id) {
        sessionService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Session deleted"));
    }
}
