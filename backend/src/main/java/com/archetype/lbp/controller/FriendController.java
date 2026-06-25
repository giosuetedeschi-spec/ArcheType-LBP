package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.FriendRequest;
import com.archetype.lbp.dto.FriendResponse;
import com.archetype.lbp.service.FriendService;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<ApiResponse<String>> addFriend(@PathVariable Long userId, @RequestBody FriendRequest req) {
        friendService.addFriend(userId, req.getFriendId());
return ResponseEntity.ok(ApiResponse.ok(null, "Friend request sent"));
    }

    @PutMapping("/{friendId}")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Long userId,
            @PathVariable Long friendId,
            @RequestBody FriendRequest req) {
        friendService.updateStatus(userId, friendId, req.getAction());
        return ResponseEntity.ok(ApiResponse.ok(null, "Request " + req.getAction() + "ed"));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<String>> remove(@PathVariable Long userId, @PathVariable Long friendId) {
        friendService.removeFriend(userId, friendId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Friend removed"));
    }
}
