package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.UserRepository;
import com.archetype.lbp.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepo;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> list() {
        List<UserResponse> users = userRepo.findAll().stream().map(u -> {
            UserResponse r = new UserResponse();
            r.setId(u.getId());
            r.setUsername(u.getUsername());
            r.setEmail(u.getEmail());
            r.setCreatedAt(u.getCreatedAt());
            return r;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> get(@PathVariable Long id) {
        return userRepo.findById(id)
                .map(u -> {
                    UserResponse r = new UserResponse();
                    r.setId(u.getId());
                    r.setUsername(u.getUsername());
                    r.setEmail(u.getEmail());
                    r.setCreatedAt(u.getCreatedAt());
                    return ResponseEntity.ok(ApiResponse.ok(r));
                })
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody UserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(userService.register(req), "User registered"));
    }
}
