package com.archetype.lbp.controller;

import com.archetype.lbp.model.User;
import com.archetype.lbp.security.JwtUtils;
import com.archetype.lbp.security.OAuthStateStore;
import com.archetype.lbp.service.GoogleOAuthService;
import com.archetype.lbp.service.GoogleOAuthService.GoogleProfile;
import com.archetype.lbp.service.UserService;
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
 * Login "Continua con Google" — stesso pattern di {@link SteamAuthController}
 * (issue "Google OAuth2: manca success handler + conflitto STATELESS"): tutti
 * gli endpoint sono redirect a pagina intera (mai JSON/XHR), lo scambio è
 * manuale invece di {@code oauth2Login()} di Spring (vedi
 * {@link GoogleOAuthService} per il perché), il risultato finale è sempre un
 * redirect verso il frontend con l'esito in query string.
 *
 * A differenza di Steam, Google fornisce un'email verificata: niente flusso
 * di "collega account" separato per il login — find-or-create diretto su
 * quell'email (vedi {@code UserService.findOrCreateByGoogleProfile}).
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/google")
@RequiredArgsConstructor
public class GoogleAuthController {

    private final GoogleOAuthService googleOAuthService;
    private final UserService userService;
    private final JwtUtils jwtUtils;
    private final OAuthStateStore stateStore;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /** Avvia il login: redirect a Google, che poi tornerà su /callback. */
    @GetMapping("/login")
    public void login(HttpServletResponse response) throws IOException {
        String state = stateStore.createLoginState();
        response.sendRedirect(googleOAuthService.buildAuthorizationUrl(state));
    }

    /** Google torna qui dopo il consenso. Verifica lo state, scambia il code, trova/crea l'utente, emette il JWT, redirect al frontend. */
    @GetMapping("/callback")
    public void callback(@RequestParam(required = false) String code,
                          @RequestParam(required = false) String state,
                          @RequestParam(required = false) String error,
                          HttpServletResponse response) throws IOException {
        if (error != null) {
            log.warn("Login Google: consenso negato o errore da Google ({})", error);
            redirectWithError(response, "google_denied");
            return;
        }
        if (stateStore.consume(state).isEmpty()) {
            log.warn("Login Google: state non valido/scaduto");
            redirectWithError(response, "invalid_state");
            return;
        }
        if (code == null) {
            redirectWithError(response, "missing_code");
            return;
        }

        Optional<GoogleProfile> profile = googleOAuthService.exchangeCodeForProfile(code);
        if (profile.isEmpty()) {
            redirectWithError(response, "google_verification_failed");
            return;
        }

        GoogleProfile p = profile.get();
        User user = userService.findOrCreateByGoogleProfile(p.email(), p.name(), p.avatarUrl());
        String token = jwtUtils.generateToken(user.getUsername());

        log.info("Login Google riuscito - Username: '{}', UserID: {}", user.getUsername(), user.getId());

        // Stessa forma minima del redirect Steam — vedi SteamAuthController
        // per il perché (frontend deve poter aprire la sessione senza una
        // seconda chiamata API).
        response.sendRedirect(frontendUrl + "/oauth-callback"
                + "?token=" + enc(token)
                + "&userId=" + user.getId()
                + "&username=" + enc(user.getUsername()));
    }

    private void redirectWithError(HttpServletResponse response, String errorCode) throws IOException {
        response.sendRedirect(frontendUrl + "/login?error=" + enc(errorCode));
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
