package com.archetype.lbp.dto;

import lombok.Data;
import java.time.LocalDateTime;

// Niente campo "email": questo DTO viene restituito da endpoint che
// qualunque utente autenticato può interrogare per ID di un ALTRO utente
// (es. GET /api/users/{id}, usato dalla pagina profilo pubblica) — non va
// esposta un'informazione privata come l'email a chiunque sia loggato.
@Data
public class UserResponse {
    private Long id;
    private String username;
    private String avatarUrl;
    private String status;
    private String bio;
    private LocalDateTime createdAt;
}
