package com.archetype.lbp.repository;

import com.archetype.lbp.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository per la gestione delle entità {@link User}.
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /** Trova un utente tramite il suo username esatto (case-sensitive). */
    Optional<User> findByUsername(String username);
    
    /** Trova un utente tramite la sua email esatta (case-sensitive). */
    Optional<User> findByEmail(String email);

    /** Trova un utente con questo Steam ID collegato — sempre via azione esplicita dal Profilo, mai per auto-match (vedi docs/OAUTH_LOGIN_PLAN.md). */
    Optional<User> findBySteamId(String steamId);
}
