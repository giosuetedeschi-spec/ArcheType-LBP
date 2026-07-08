package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.LeaderboardFilterRequest;
import com.archetype.lbp.dto.LeaderboardResponse;
import com.archetype.lbp.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Nessun matcher pubblico per /api/leaderboard in SecurityConfig, quindi
// l'endpoint richiede già un Bearer token valido (regola di default
// "anyRequest().authenticated()") — non serve aggiungere altro qui.
@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<LeaderboardResponse>> get(LeaderboardFilterRequest filter) {
        return ResponseEntity.ok(ApiResponse.ok(leaderboardService.getLeaderboard(filter)));
    }
}
