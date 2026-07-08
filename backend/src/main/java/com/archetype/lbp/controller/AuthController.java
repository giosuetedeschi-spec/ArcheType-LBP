package com.archetype.lbp.controller;

import com.archetype.lbp.dto.AuthRequest;
import com.archetype.lbp.dto.AuthResponse;
import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.model.User;
import com.archetype.lbp.security.JwtUtils;
import com.archetype.lbp.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

            String token = jwtUtils.generateToken(req.getUsername());
            User user = userService.findByUsername(req.getUsername());

            return ResponseEntity.ok(ApiResponse.ok(
                    new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail()),
                    "Login effettuato"));
        } catch (AuthenticationException e) {
            log.warn("Login fallito per username '{}': {}", req.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Credenziali non valide"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody UserRequest req) {
        UserResponse created = userService.register(req);
        String token = jwtUtils.generateToken(created.getUsername());

        // L'email non è più su UserResponse (non va esposta pubblicamente
        // via GET /api/users/{id} ad altri utenti), ma qui è legittimo:
        // è l'utente stesso appena registrato che rivede la propria email,
        // la stessa già validata in req.
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                new AuthResponse(token, created.getId(), created.getUsername(), req.getEmail()),
                "Registrazione completata"));
    }
}
