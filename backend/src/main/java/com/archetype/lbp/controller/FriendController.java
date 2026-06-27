package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.FriendRequest;
import com.archetype.lbp.dto.FriendResponse;
import com.archetype.lbp.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriends(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(friendService.getFriends(userId)));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getPending(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(friendService.getPending(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addFriend(
            @PathVariable Long userId,
            @RequestBody FriendRequest req) {
        friendService.addFriend(userId, req.getFriendId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(null, "Richiesta di amicizia inviata"));
    }

    @PutMapping("/{friendId}/accept")
    public ResponseEntity<ApiResponse<Void>> accept(
            @PathVariable Long userId,
            @PathVariable Long friendId) {
        friendService.updateStatus(userId, friendId, "accept");
        return ResponseEntity.ok(ApiResponse.ok(null, "Richiesta di amicizia accettata"));
    }

    @PutMapping("/{friendId}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long userId,
            @PathVariable Long friendId) {
        friendService.updateStatus(userId, friendId, "reject");
        return ResponseEntity.ok(ApiResponse.ok(null, "Richiesta di amicizia rifiutata"));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable Long userId,
            @PathVariable Long friendId) {
        friendService.removeFriend(userId, friendId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Amico rimosso"));
    }
}
