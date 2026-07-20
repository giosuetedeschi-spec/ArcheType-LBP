package com.archetype.lbp.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

/**
 * Store in memoria (Caffeine, già dipendenza del progetto per le cache
 * StatsService/UserGameService — riusata qui per lo stesso motivo: nessun
 * bisogno di un componente esterno per dati che scadono da soli in pochi
 * minuti) per lo "state" del flusso OpenID di Steam.
 *
 * Serve a due scopi contemporaneamente:
 * 1. Protezione CSRF: solo uno state generato da noi ed emesso di recente
 *    viene accettato al callback (altrimenti chiunque potrebbe forgiare una
 *    richiesta di callback e farsi loggare come un altro utente).
 * 2. Collegare il callback Steam all'utente che l'ha richiesto quando serve
 *    un'azione autenticata ("Collega Steam" dal Profilo, vedi
 *    docs/OAUTH_LOGIN_PLAN.md) — cosa che altrimenti non sarebbe possibile
 *    con un backend stateless a soli JWT: il redirect verso Steam è una
 *    navigazione a pagina intera, non una richiesta con header
 *    Authorization, quindi il JWT non può viaggiare lì. Il chiamante già
 *    autenticato lo passa una volta sola come query param sull'endpoint di
 *    init (?token=...), che qui lo traduce subito in un nonce opaco: solo
 *    quel nonce (mai il JWT) finisce nell'URL di ritorno da Steam, quindi
 *    mai in log/cronologia browser di terzi.
 */
@Component
public class OAuthStateStore {

    private final Cache<String, Long> linkTargets = Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    private static final Long ANONYMOUS = -1L;
    private final SecureRandom random = new SecureRandom();

    /** State per un login anonimo (nessun utente da collegare). */
    public String createLoginState() {
        return create(ANONYMOUS);
    }

    /** State per collegare il provider all'utente già autenticato {@code userId}. */
    public String createLinkState(Long userId) {
        return create(userId);
    }

    private String create(Long userId) {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        String nonce = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        linkTargets.put(nonce, userId);
        return nonce;
    }

    /**
     * Consuma (rimuove, valido una sola volta) lo state ricevuto al
     * callback.
     *
     * @return null se lo state non è valido/scaduto/già usato; altrimenti
     * l'id utente da collegare, o {@code Optional.empty()} se era un login
     * anonimo.
     */
    public java.util.Optional<java.util.Optional<Long>> consume(String state) {
        if (state == null) return java.util.Optional.empty();
        Long userId = linkTargets.asMap().remove(state);
        if (userId == null) return java.util.Optional.empty();
        return java.util.Optional.of(ANONYMOUS.equals(userId) ? java.util.Optional.empty() : java.util.Optional.of(userId));
    }
}
