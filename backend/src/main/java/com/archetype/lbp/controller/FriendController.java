package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.FriendRequest;
import com.archetype.lbp.dto.FriendResponse;
import com.archetype.lbp.service.FriendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/friends")
@RequiredArgsConstructor
public class FriendController {

    private static final Logger log = LoggerFactory.getLogger(FriendController.class);

    private final FriendService friendService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriends(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(friendService.getFriends(userId)));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getPending(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(friendService.getPending(userId)));
    }

    /**
     * Invia una richiesta di amicizia.
     * Issue #15: aggiunto log INFO per tracciare l'invio riuscito.
     *
     * @param userId ID dell'utente che invia la richiesta
     * @param req dati della richiesta di amicizia
     * @return ResponseEntity con status 201
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addFriend(
            @PathVariable Long userId,
            @Valid @RequestBody FriendRequest req) {
        friendService.addFriend(userId, req.getFriendId());
        log.info("Friend request sent - From UserID: {}, To UserID: {}", userId, req.getFriendId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(null, "Richiesta di amicizia inviata"));
    }

    /**
     * Accetta una richiesta di amicizia in sospeso.
     * Issue #15: aggiunto log INFO per tracciare l'accettazione riuscita.
     *
     * @param userId ID dell'utente che accetta
     * @param friendId ID dell'utente la cui richiesta viene accettata
     * @return ResponseEntity con status 200
     */
    @PutMapping("/{friendId}/accept")
    public ResponseEntity<ApiResponse<Void>> accept(
            @PathVariable Long userId,
            @PathVariable Long friendId) {
        friendService.updateStatus(userId, friendId, "accept");
        log.info("Friend request accepted - UserID: {}, FriendID: {}", userId, friendId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Richiesta di amicizia accettata"));
    }

    /**
     * Rifiuta una richiesta di amicizia in sospeso.
     * Issue #15: aggiunto log INFO per tracciare il rifiuto riuscito.
     *
     * @param userId ID dell'utente che rifiuta
     * @param friendId ID dell'utente la cui richiesta viene rifiutata
     * @return ResponseEntity con status 200
     */
    @PutMapping("/{friendId}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long userId,
            @PathVariable Long friendId) {
        friendService.updateStatus(userId, friendId, "reject");
        log.info("Friend request rejected - UserID: {}, FriendID: {}", userId, friendId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Richiesta di amicizia rifiutata"));
    }

    /**
     * Rimuove un amico.
     * Issue #15: aggiunto log INFO per tracciare la rimozione riuscita.
     *
     * @param userId ID dell'utente che rimuove l'amico
     * @param friendId ID dell'amico da rimuovere
     * @return ResponseEntity con status 200
     */
    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable Long userId,
            @PathVariable Long friendId) {
        friendService.removeFriend(userId, friendId);
        log.info("Friend removed - UserID: {}, FriendID: {}", userId, friendId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Amico rimosso"));
    }
}