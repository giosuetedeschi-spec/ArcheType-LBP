package com.archetype.lbp.controller;

import com.archetype.lbp.dto.*;
import com.archetype.lbp.service.BacklogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/games")
@RequiredArgsConstructor
public class BacklogController {
    private final BacklogService backlogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BacklogResponse>>> list(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(backlogService.getUserGames(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BacklogResponse>> add(
            @PathVariable Long userId,
            @Valid @RequestBody BacklogRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(backlogService.addGame(userId, req), "Game added to backlog"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BacklogResponse>> update(
            @PathVariable Long userId,
            @PathVariable Long id,
            @RequestBody BacklogRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(backlogService.updateStatus(userId, id, req.getStatus()), "Status updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable Long userId, @PathVariable Long id) {
        backlogService.removeGame(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Game removed from backlog"));
    }
}
