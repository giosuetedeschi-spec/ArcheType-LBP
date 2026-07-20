package com.archetype.lbp.controller;

import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.model.User;
import com.archetype.lbp.security.JwtUtils;
import com.archetype.lbp.security.OAuthStateStore;
import com.archetype.lbp.service.SteamOpenIdService;
import com.archetype.lbp.service.SteamOpenIdService.SteamProfile;
import com.archetype.lbp.service.UserService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Login/collegamento Steam (docs/OAUTH_LOGIN_PLAN.md, issue #102). Tutti gli
 * endpoint sono redirect a pagina intera (mai JSON): il browser deve andare
 * fisicamente su Steam e tornare, non è un flusso XHR/fetch. Il risultato
 * finale è sempre un redirect verso il frontend, con l'esito in query string
 * (token per il login, un flag/errore per il collegamento) — coerente con
 * "/api/auth/**" già permitAll in SecurityConfig, nessuna modifica lì
 * necessaria.
 *
 * Due percorsi distinti, mai mescolati (vedi docs/OAUTH_LOGIN_PLAN.md,
 * sezione "Account linking"):
 * - login: pubblico, find-or-create solo per steamId, mai un tentativo di
 *   indovinare un account esistente.
 * - link: richiede un JWT valido già emesso (utente già autenticato),
 *   collega lo steamId a QUELL'account specifico.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/steam")
@RequiredArgsConstructor
public class SteamAuthController {

    private final SteamOpenIdService steamOpenIdService;
    private final UserService userService;
    private final JwtUtils jwtUtils;
    private final OAuthStateStore stateStore;

    // Default inline: vedi SteamOpenIdService per il perché (profilo di
    // test non eredita application.properties di produzione).
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /** Avvia il login: redirect a Steam, che poi tornerà su /callback. */
    @GetMapping("/login")
    public void login(HttpServletResponse response) throws IOException {
        response.sendRedirect(steamOpenIdService.buildAuthorizationUrl("/api/auth/steam/callback"));
    }

    /** Steam torna qui dopo il login. Verifica, trova/crea l'utente, emette il JWT, redirect al frontend. */
    @GetMapping("/callback")
    public void callback(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Optional<String> steamId = steamOpenIdService.verifyAndExtractSteamId(request);
        if (steamId.isEmpty()) {
            log.warn("Login Steam: verifica OpenID fallita");
            redirectWithError(response, "/login", "steam_verification_failed");
            return;
        }

        SteamProfile profile = steamOpenIdService.fetchProfile(steamId.get());
        User user = userService.findOrCreateBySteamId(
                profile.steamId(), profile.displayName(), profile.avatarUrl());
        String token = jwtUtils.generateToken(user.getUsername());

        log.info("Login Steam riuscito - Username: '{}', UserID: {}, SteamID: {}",
                user.getUsername(), user.getId(), steamId.get());

        // userId/username inclusi qui apposta (non solo il token): il
        // frontend deve poter aprire la sessione senza una seconda chiamata
        // API ("chi sono?") — stessa forma minima già usata da AuthContext
        // per il login classico (id + username, niente email).
        response.sendRedirect(frontendUrl + "/oauth-callback"
                + "?token=" + enc(token)
                + "&userId=" + user.getId()
                + "&username=" + enc(user.getUsername()));
    }

    /**
     * Avvia il collegamento Steam per un utente già autenticato (azione
     * "Collega Steam" dal Profilo). Il JWT arriva come query param una sola
     * volta qui (una navigazione a pagina intera non può portare un header
     * Authorization) e viene tradotto subito in un nonce opaco — vedi
     * OAuthStateStore per il perché non è il JWT stesso a fare il giro
     * di andata/ritorno da Steam.
     */
    @GetMapping("/link")
    public void link(@RequestParam String token, HttpServletResponse response) throws IOException {
        Long userId = resolveUserId(token);
        if (userId == null) {
            redirectWithError(response, "/profile", "invalid_link_token");
            return;
        }
        String state = stateStore.createLinkState(userId);
        response.sendRedirect(steamOpenIdService.buildAuthorizationUrl(
                "/api/auth/steam/link-callback?state=" + enc(state)));
    }

    /** Steam torna qui dopo un collegamento. Verifica, risolve il nonce, collega, redirect al profilo. */
    @GetMapping("/link-callback")
    public void linkCallback(@RequestParam String state, HttpServletRequest request,
                              HttpServletResponse response) throws IOException {
        Optional<Optional<Long>> resolved = stateStore.consume(state);
        if (resolved.isEmpty() || resolved.get().isEmpty()) {
            log.warn("Collegamento Steam: state non valido/scaduto");
            redirectWithError(response, "/profile", "invalid_state");
            return;
        }
        Long userId = resolved.get().get();

        Optional<String> steamId = steamOpenIdService.verifyAndExtractSteamId(request);
        if (steamId.isEmpty()) {
            redirectWithError(response, "/profile", "steam_verification_failed");
            return;
        }

        try {
            userService.linkSteamAccount(userId, steamId.get());
        } catch (IllegalStateException e) {
            redirectWithError(response, "/profile", "steam_already_linked");
            return;
        }

        log.info("Steam collegato - UserID: {}, SteamID: {}", userId, steamId.get());
        response.sendRedirect(frontendUrl + "/profile?steamLinked=true");
    }

    /** @return l'id utente se il token è un JWT valido di un utente esistente, altrimenti null. */
    private Long resolveUserId(String token) {
        try {
            String username = jwtUtils.getUsernameFromToken(token);
            return userService.findByUsername(username).getId();
        } catch (JwtException | IllegalArgumentException | ResourceNotFoundException e) {
            return null;
        }
    }

    private void redirectWithError(HttpServletResponse response, String path, String errorCode) throws IOException {
        response.sendRedirect(frontendUrl + path + "?error=" + enc(errorCode));
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
