package com.archetype.lbp.service;

import com.archetype.lbp.dto.ReviewRequest;
import com.archetype.lbp.dto.ReviewResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.model.Game;
import com.archetype.lbp.model.Review;
import com.archetype.lbp.model.User;
import com.archetype.lbp.repository.GameRepository;
import com.archetype.lbp.repository.ReviewRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {
    private final ReviewRepository reviewRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getGameReviews(Long gameId) {
        if (!gameRepo.existsById(gameId)) {
            throw new ResourceNotFoundException("Game", "id", gameId);
        }
        return reviewRepo.findByGame_IdOrderByCreatedAtDesc(gameId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Crea la recensione dell'utente per un gioco, o aggiorna quella già
     * esistente (una recensione per utente per gioco — UNIQUE constraint
     * in db/init.sql). Non è un errore se esiste già: un nuovo invio è
     * semplicemente il modo in cui l'utente modifica la propria recensione,
     * non un tentativo di crearne una seconda.
     */
    public ReviewResponse addOrUpdateReview(Long userId, ReviewRequest req) {
        if (req.getGameId() == null) {
            throw new IllegalArgumentException("Game ID is required");
        }
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Game game = gameRepo.findById(req.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", req.getGameId()));

        Review review = reviewRepo.findByUser_IdAndGame_Id(userId, req.getGameId())
                .orElseGet(() -> {
                    Review r = new Review();
                    r.setUser(user);
                    r.setGame(game);
                    return r;
                });
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        return toResponse(reviewRepo.save(review));
    }

    public void removeReview(Long userId, Long reviewId) {
        Review review = reviewRepo.findByIdAndUser_Id(reviewId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        reviewRepo.delete(review);
    }

    private ReviewResponse toResponse(Review review) {
        ReviewResponse r = new ReviewResponse();
        r.setId(review.getId());
        r.setGameId(review.getGame().getId());
        r.setUserId(review.getUser().getId());
        r.setUsername(review.getUser().getUsername());
        r.setRating(review.getRating());
        r.setComment(review.getComment());
        r.setCreatedAt(review.getCreatedAt());
        r.setUpdatedAt(review.getUpdatedAt());
        return r;
    }
}
