package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {
    private final DataSource dataSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("timestamp", LocalDateTime.now().toString());
        result.put("version", "1.0.0");

        try (Connection conn = dataSource.getConnection()) {
            result.put("database", "UP");
        } catch (Exception e) {
            result.put("database", "DOWN: " + e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
