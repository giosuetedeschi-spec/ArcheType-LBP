package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(userService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getById(id)));
    }

    /**
     * Registra un nuovo utente.
     * Issue #15: aggiunto log INFO per tracciare la registrazione riuscita.
     * 
     * @param req dati dell'utente da registrare
     * @return ResponseEntity con l'utente registrato e status 201
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody UserRequest req) {
        UserResponse response = userService.register(req);
        log.info("User registered successfully - ID: {}", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Utente registrato"));
    }

    /**
     * Aggiorna il profilo di un utente esistente.
     * Issue #15: aggiunto log INFO per tracciare l'aggiornamento riuscito.
     * 
     * @param id ID dell'utente da aggiornare
     * @param req dati aggiornati dell'utente
     * @return ResponseEntity con il profilo aggiornato
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable Long id,
            @RequestBody UserRequest req) {
        UserResponse response = userService.update(id, req);
        log.info("User profile updated successfully - ID: {}", id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Profilo aggiornato"));
    }
}