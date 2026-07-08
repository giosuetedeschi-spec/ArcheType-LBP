package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.ReviewRequest;
import com.archetype.lbp.dto.ReviewResponse;
import com.archetype.lbp.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Due basi diverse per lo stesso resource: lettura sotto /games (pubblica,
// vedi SecurityConfig — GET /api/games/** non richiede login, come per il
// catalogo), scrittura sotto /users/{userId} (autenticata), stesso schema
// già usato altrove nel backend (userId esplicito nel path, non estratto
// dal JWT).
@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/games/{gameId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getGameReviews(@PathVariable Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getGameReviews(gameId)));
    }

    @PostMapping("/api/users/{userId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> addOrUpdateReview(
            @PathVariable Long userId,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(reviewService.addOrUpdateReview(userId, req), "Recensione salvata"));
    }

    @DeleteMapping("/api/users/{userId}/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> removeReview(
            @PathVariable Long userId,
            @PathVariable Long reviewId) {
        reviewService.removeReview(userId, reviewId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Recensione rimossa"));
    }
}
