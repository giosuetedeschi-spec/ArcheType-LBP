package com.archetype.lbp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    @NotBlank
    @Email
    private String email;

    // Nullable: un account creato via Steam non ha una password propria —
    // fa login tramite il provider, mai per questo campo. Niente @NotBlank
    // qui: la validazione "password obbligatoria" resta solo sul percorso
    // di registrazione classica (RegisterRequest), non sull'entity,
    // altrimenti bloccherebbe anche la creazione di account Steam-only.
    @Column(name = "password")
    private String passwordHash;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "status")
    private String status = "online";

    private String bio;

    // Steam non ha email, quindi il collegamento avviene solo come azione
    // esplicita da un account già autenticato ("Collega Steam" nel
    // Profilo), mai per auto-match al login — vedi docs/OAUTH_LOGIN_PLAN.md.
    // Indipendente da password: un utente può avere entrambe, non è
    // esclusivo.
    @Column(name = "steam_id")
    private String steamId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
