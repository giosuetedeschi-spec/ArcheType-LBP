package com.archetype.lbp;

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

    @Column(name = "password_hash", nullable = false)
    @NotBlank
    private String passwordHash;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "status")
    private String status = "online";

    private String bio;

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
