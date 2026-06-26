package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.UserStatsResponse;
import com.archetype.lbp.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{userId}/stats")
@RequiredArgsConstructor
public class StatsController {
    private final StatsService statsService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserStatsResponse>> stats(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(statsService.getUserStats(userId)));
    }
}
