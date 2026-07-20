package com.archetype.lbp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.regex.Pattern;

/**
 * Relying party OpenID 2.0 per "Continua con Steam" (docs/OAUTH_LOGIN_PLAN.md,
 * issue #102). Steam non parla OAuth2/OIDC — solo OpenID 2.0 — quindi non è
 * rappresentabile con spring-boot-starter-oauth2-client: qui il flusso è
 * scritto a mano seguendo la specifica (checkid_setup + check_authentication),
 * più una chiamata alla Steam Web API per i dati di profilo (username,
 * avatar), che l'OpenID di per sé non fornisce.
 */
@Service
@Slf4j
public class SteamOpenIdService {

    private static final String STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
    private static final String STEAM_ID_URL_PREFIX = "https://steamcommunity.com/openid/id/";
    private static final Pattern STEAM_ID_PATTERN = Pattern.compile("^\\d{17}$");

    // Default inline (non solo nel main application.properties): il profilo
    // di test carica src/test/resources/application.properties, che
    // sostituisce interamente quello di produzione invece di unirvisi —
    // senza un default qui il contesto Spring dei test non si avvia più
    // ("Could not resolve placeholder").
    @Value("${steam.api.key:}")
    private String steamApiKey;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Costruisce l'URL su cui reindirizzare il browser per far autenticare
     * l'utente su Steam (checkid_setup). {@code returnToPath} è il percorso
     * del nostro callback (es. "/api/auth/steam/callback") — eventuali
     * query param extra (es. lo state per il flusso "Collega Steam") vanno
     * già inclusi lì, Steam li restituisce invariati nel redirect di ritorno.
     */
    public String buildAuthorizationUrl(String returnToPath) {
        String returnTo = appBaseUrl + returnToPath;
        String realm = appBaseUrl;
        return STEAM_OPENID_ENDPOINT
                + "?openid.ns=" + enc("http://specs.openid.net/auth/2.0")
                + "&openid.mode=" + enc("checkid_setup")
                + "&openid.return_to=" + enc(returnTo)
                + "&openid.realm=" + enc(realm)
                + "&openid.identity=" + enc("http://specs.openid.net/auth/2.0/identifier_select")
                + "&openid.claimed_id=" + enc("http://specs.openid.net/auth/2.0/identifier_select");
    }

    /**
     * Verifica la risposta di Steam ricevuta sul callback (tutti i parametri
     * "openid.*" nella query string) ripostandola a Steam stesso con
     * openid.mode=check_authentication — è l'unico modo per essere certi che
     * la risposta non sia stata forgiata da un client malevolo, dato che
     * Steam non firma con un meccanismo verificabile localmente (niente
     * JWKS, a differenza di OIDC).
     *
     * @return il SteamID64 se la verifica è valida, altrimenti empty.
     */
    public java.util.Optional<String> verifyAndExtractSteamId(HttpServletRequest request) {
        if (!"id_res".equals(request.getParameter("openid.mode"))) {
            return java.util.Optional.empty();
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        Enumeration<String> names = request.getParameterNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            if (name.startsWith("openid.")) {
                body.add(name, request.getParameter(name));
            }
        }
        body.set("openid.mode", "check_authentication");

        String response;
        try {
            response = restClient.post()
                    .uri(STEAM_OPENID_ENDPOINT)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.warn("Verifica OpenID Steam fallita (errore di rete/HTTP): {}", e.getMessage());
            return java.util.Optional.empty();
        }

        if (response == null || !response.contains("is_valid:true")) {
            log.warn("Verifica OpenID Steam: risposta non valida da Steam ({})", response);
            return java.util.Optional.empty();
        }

        String claimedId = request.getParameter("openid.claimed_id");
        if (claimedId == null || !claimedId.startsWith(STEAM_ID_URL_PREFIX)) {
            return java.util.Optional.empty();
        }
        String steamId = claimedId.substring(STEAM_ID_URL_PREFIX.length());
        // Un SteamID64 è sempre 17 cifre — scarta qualunque cosa non lo sia
        // invece di fidarsi ciecamente del formato URL (difesa in profondità,
        // oltre alla verifica is_valid già fatta sopra).
        if (!STEAM_ID_PATTERN.matcher(steamId).matches()) {
            log.warn("claimed_id verificato ma con SteamID64 in formato inatteso: {}", claimedId);
            return java.util.Optional.empty();
        }
        return java.util.Optional.of(steamId);
    }

    /** Profilo pubblico minimo recuperato dalla Steam Web API. */
    public record SteamProfile(String steamId, String displayName, String avatarUrl) {}

    /**
     * Recupera nome utente pubblico e avatar da ISteamUser/GetPlayerSummaries
     * — l'OpenID da solo dà solo lo SteamID64, non dati di profilo.
     *
     * @return il profilo, oppure un profilo con solo lo steamId (nome/avatar
     * null) se la chiave API non è configurata o la chiamata fallisce — un
     * account viene comunque creato/collegato, solo senza quei dettagli.
     */
    public SteamProfile fetchProfile(String steamId) {
        if (steamApiKey == null || steamApiKey.isBlank()) {
            log.warn("STEAM_API_KEY non configurata: creo/collego l'account senza nome utente/avatar Steam.");
            return new SteamProfile(steamId, null, null);
        }
        String url = UriComponentsBuilder
                .fromUriString("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/")
                .queryParam("key", steamApiKey)
                .queryParam("steamids", steamId)
                .toUriString();
        try {
            String json = restClient.get().uri(url).retrieve().body(String.class);
            JsonNode players = objectMapper.readTree(json).path("response").path("players");
            if (players.isArray() && !players.isEmpty()) {
                JsonNode player = players.get(0);
                String name = player.path("personaname").asText(null);
                String avatar = player.path("avatarfull").asText(null);
                return new SteamProfile(steamId, name, avatar);
            }
        } catch (Exception e) {
            log.warn("Recupero profilo Steam fallito per steamId={}: {}", steamId, e.getMessage());
        }
        return new SteamProfile(steamId, null, null);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
