package com.archetype.lbp.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Client OAuth2 "Authorization Code" per Google, scritto a mano sullo stesso
 * modello di {@link SteamOpenIdService}: niente {@code oauth2Login()} di
 * Spring Security. Quel meccanismo si appoggia alla HttpSession per tenere
 * lo stato dell'authorization request tra andata e ritorno — in conflitto
 * con {@code SessionCreationPolicy.STATELESS} di questo backend — e comunque
 * termina con una sessione lato server, non con un redirect al frontend
 * corredato di JWT come serve qui (vedi issue "Google OAuth2: manca success
 * handler + conflitto STATELESS").
 *
 * Il nonce anti-CSRF/replay è {@link com.archetype.lbp.security.OAuthStateStore},
 * già usato da Steam, qui tramite {@code createLoginState()}/{@code consume()}
 * senza collegamento a un utente: Google fornisce già un'email verificata,
 * quindi — a differenza di Steam — non serve un flusso di "collega account"
 * separato per il solo login.
 */
@Service
@Slf4j
public class GoogleOAuthService {

    private static final String AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

    // Default vuoto (come steam.api.key): l'app si avvia comunque senza
    // credenziali reali, solo il login Google non funzionerà finché non
    // vengono configurate GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.
    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String clientSecret;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** URL di callback: deve corrispondere esattamente a quello registrato in Google Cloud Console per questo client. */
    private String redirectUri() {
        return appBaseUrl + "/api/auth/google/callback";
    }

    /** Costruisce l'URL su cui reindirizzare il browser per il consenso Google. */
    public String buildAuthorizationUrl(String state) {
        return AUTHORIZATION_ENDPOINT
                + "?client_id=" + enc(clientId)
                + "&redirect_uri=" + enc(redirectUri())
                + "&response_type=" + enc("code")
                + "&scope=" + enc("openid email profile")
                + "&state=" + enc(state)
                + "&access_type=" + enc("online")
                + "&prompt=" + enc("select_account");
    }

    /** Profilo minimo recuperato da Google dopo lo scambio del code. */
    public record GoogleProfile(String googleId, String email, String name, String avatarUrl) {}

    /**
     * Scambia l'authorization code ricevuto al callback per un access token,
     * poi lo usa per leggere il profilo dall'userinfo endpoint.
     *
     * @return il profilo, oppure empty se lo scambio/la lettura falliscono
     * (code scaduto/riusato, credenziali non configurate, errore di rete,
     * email assente dalla risposta).
     */
    public Optional<GoogleProfile> exchangeCodeForProfile(String code) {
        String accessToken;
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", code);
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("redirect_uri", redirectUri());
            body.add("grant_type", "authorization_code");

            String tokenJson = restClient.post()
                    .uri(TOKEN_ENDPOINT)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            accessToken = objectMapper.readTree(tokenJson).path("access_token").asText(null);
            if (accessToken == null) {
                log.warn("Scambio code Google: risposta senza access_token");
                return Optional.empty();
            }
        } catch (RestClientException | JsonProcessingException e) {
            log.warn("Scambio code Google fallito: {}", e.getMessage());
            return Optional.empty();
        }

        try {
            String userJson = restClient.get()
                    .uri(USERINFO_ENDPOINT)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(String.class);

            JsonNode node = objectMapper.readTree(userJson);
            String googleId = node.path("sub").asText(null);
            String email = node.path("email").asText(null);
            String name = node.path("name").asText(null);
            String picture = node.path("picture").asText(null);

            if (email == null) {
                log.warn("Userinfo Google senza email — impossibile creare/trovare l'utente");
                return Optional.empty();
            }
            return Optional.of(new GoogleProfile(googleId, email, name, picture));
        } catch (RestClientException | JsonProcessingException e) {
            log.warn("Lettura profilo Google fallita: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
