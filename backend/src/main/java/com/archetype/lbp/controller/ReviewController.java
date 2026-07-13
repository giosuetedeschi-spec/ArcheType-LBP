package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.ReviewRequest;
import com.archetype.lbp.dto.ReviewResponse;
import com.archetype.lbp.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(ReviewController.class);

    private final ReviewService reviewService;

    @GetMapping("/api/games/{gameId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getGameReviews(@PathVariable Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getGameReviews(gameId)));
    }

    @GetMapping("/api/users/{userId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getUserReviews(userId)));
    }

    /**
     * Crea o aggiorna una recensione per un gioco.
     * Issue #15: aggiunto log INFO per tracciare il salvataggio riuscito.
     *
     * @param userId ID dell'utente che scrive la recensione
     * @param req dati della recensione
     * @return ResponseEntity con la recensione salvata e status 201
     */
    @PostMapping("/api/users/{userId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> addOrUpdateReview(
            @PathVariable Long userId,
            @Valid @RequestBody ReviewRequest req) {
        ReviewResponse response = reviewService.addOrUpdateReview(userId, req);
        log.info("Review saved successfully - UserID: {}, GameID: {}, ReviewID: {}", userId, req.getGameId(), response.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Recensione salvata"));
    }

    /**
     * Rimuove una recensione.
     * Issue #15: aggiunto log INFO per tracciare la rimozione riuscita.
     *
     * @param userId ID dell'utente proprietario della recensione
     * @param reviewId ID della recensione da rimuovere
     * @return ResponseEntity con status 200
     */
    @DeleteMapping("/api/users/{userId}/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> removeReview(
            @PathVariable Long userId,
            @PathVariable Long reviewId) {
        reviewService.removeReview(userId, reviewId);
        log.info("Review removed successfully - UserID: {}, ReviewID: {}", userId, reviewId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Recensione rimossa"));
    }
}