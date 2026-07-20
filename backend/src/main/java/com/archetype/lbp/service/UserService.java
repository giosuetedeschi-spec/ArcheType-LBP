package com.archetype.lbp.service;

import com.archetype.lbp.model.User;
import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service per la gestione degli utenti (registrazione, profilo, autenticazione).
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registra un nuovo utente con username, email e password.
     * @return l'utente registrato
     * @throws IllegalArgumentException se username o email sono già in uso
     */
    public UserResponse register(UserRequest req) {
        if (userRepo.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username già in uso: " + req.getUsername());
        }
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email già registrata: " + req.getEmail());
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        // Password hashata con BCrypt
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));

        user = userRepo.save(user);

        // Avatar segnaposto automatico: una foto di gatto deterministica e
        // sempre distinta per ogni nuovo utente, derivata dall'id assegnato
        // dal DB (disponibile solo dopo il primo save). Non finisce mai i
        // gatti: ?lock=<id> genera una foto stabile per qualunque id futuro.
        user.setAvatarUrl(buildCatAvatarUrl(user.getId()));
        user = userRepo.save(user);

        return toResponse(user);
    }

    private static String buildCatAvatarUrl(Long userId) {
        return "https://loremflickr.com/200/200/cat?lock=" + userId;
    }

    /**
     * Trova l'utente già collegato a questo Steam ID, o ne crea uno nuovo
     * Steam-only — usato dal login pubblico "Continua con Steam"
     * (docs/OAUTH_LOGIN_PLAN.md). Non collega mai a un account esistente
     * diverso: se lo steamId non risulta già associato, l'esito è sempre un
     * account nuovo, mai un tentativo di indovinare quale account locale
     * potrebbe corrispondere (Steam non dà un'email da confrontare).
     *
     * @param steamId SteamID64 già verificato dal chiamante (SteamOpenIdService)
     * @param displayName nome pubblico Steam (personaname), può essere null
     *   se la Steam Web API non è configurata o non ha risposto
     * @param avatarUrl avatar Steam, può essere null per lo stesso motivo
     */
    public User findOrCreateBySteamId(String steamId, String displayName, String avatarUrl) {
        return userRepo.findBySteamId(steamId).orElseGet(() -> {
            User user = new User();
            user.setUsername(generateUniqueUsername(displayName));
            // Steam non fornisce un'email: placeholder sintetico, univoco
            // per costruzione (steamId è unico) — soddisfa il vincolo
            // NOT NULL/UNIQUE della colonna senza inventare uno schema a
            // parte solo per questo caso.
            user.setEmail("steam_" + steamId + "@steam.placeholder");
            user.setSteamId(steamId);
            User saved = userRepo.save(user);
            saved.setAvatarUrl(avatarUrl != null ? avatarUrl : buildCatAvatarUrl(saved.getId()));
            return userRepo.save(saved);
        });
    }

    /**
     * Collega uno Steam ID a un account già autenticato — azione esplicita
     * "Collega Steam" dal Profilo, l'unico modo in cui Steam si associa a un
     * account che non ha creato lui stesso (vedi docs/OAUTH_LOGIN_PLAN.md).
     *
     * @throws IllegalStateException se questo Steam ID è già collegato a un
     *   account diverso da {@code userId} — non lo si "ruba" silenziosamente.
     */
    public void linkSteamAccount(Long userId, String steamId) {
        userRepo.findBySteamId(steamId).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new IllegalStateException("Questo account Steam è già collegato a un altro utente.");
            }
        });
        User user = findEntityById(userId);
        user.setSteamId(steamId);
        userRepo.save(user);
    }

    /**
     * Deriva uno username univoco e valido (3-50 caratteri) da un nome
     * suggerito (es. il nome pubblico Steam) — con fallback e suffisso
     * numerico se già occupato, stesso spirito del cat-avatar deterministico
     * sopra: non deve mai fallire per collisione.
     */
    private String generateUniqueUsername(String suggested) {
        String base = (suggested == null || suggested.isBlank())
                ? "player"
                : suggested.trim().replaceAll("\\s+", "_");
        if (base.length() > 40) base = base.substring(0, 40);
        if (base.length() < 3) base = base + "_player";

        String candidate = base;
        int suffix = 1;
        while (userRepo.findByUsername(candidate).isPresent()) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    /** Lista tutti gli utenti registrati. */
    @Transactional(readOnly = true)
    public List<UserResponse> listAll() {
        return userRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Trova un utente tramite ID. */
    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return toResponse(findEntityById(id));
    }

    /**
     * Aggiorna il profilo di un utente (avatar, status, bio).
     * @return l'utente aggiornato
     */
    public UserResponse update(Long id, UserRequest req) {
        User user = findEntityById(id);
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        if (req.getStatus()    != null) user.setStatus(req.getStatus());
        if (req.getBio()       != null) user.setBio(req.getBio());
        return toResponse(userRepo.save(user));
    }

    /** Trova un utente tramite username (usato per autenticazione). */
    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    /** Trova l'entity User tramite ID (usato internamente). */
    public User findEntityById(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    /** Converte l'entity User nel DTO UserResponse. */
    public UserResponse toResponse(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setUsername(user.getUsername());
        r.setAvatarUrl(user.getAvatarUrl());
        r.setStatus(user.getStatus());
        r.setBio(user.getBio());
        r.setSteamLinked(user.getSteamId() != null);
        r.setCreatedAt(user.getCreatedAt());
        return r;
    }
}
