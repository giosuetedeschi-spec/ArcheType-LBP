package com.archetype.lbp.service;

import com.archetype.lbp.config.CacheConfig;
import com.archetype.lbp.model.Game;
import com.archetype.lbp.model.User;
import com.archetype.lbp.model.UserGame;

import com.archetype.lbp.dto.UserGameRequest;
import com.archetype.lbp.dto.UserGameResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.GameRepository;
import com.archetype.lbp.repository.UserGameRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Gestisce le voci di libreria (UserGame) di un utente: lettura, aggiunta,
 * modifica di stato/note/tempo di gioco, rimozione.
 *
 * I tre metodi di mutazione (addGame, update, removeGame) invalidano la
 * cache delle statistiche utente (vedi {@link StatsService#getUserStats}
 * e {@link CacheConfig}) con {@code @CacheEvict}, così le statistiche
 * mostrate dopo una modifica alla libreria sono sempre corrette, invece di
 * restare quelle calcolate prima della modifica fino alla scadenza del TTL.
 *
 * Nota sul comportamento di {@code @CacheEvict}: di default (come qui)
 * l'eviction avviene DOPO che il metodo è tornato con successo
 * (beforeInvocation = false), non prima. Questo è il comportamento
 * corretto per questo caso: se un metodo lancia un'eccezione (es. utente
 * o gioco inesistente), la scrittura non è avvenuta e la cache esistente
 * resta valida — evitarla comunque butterebbe via una cache ancora
 * corretta senza motivo.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserGameService {
    private final UserGameRepository userGameRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    private static final String[] VALID_STATUSES = {"wishlist", "playing", "finished", "abandoned"};

    /**
     * Restituisce tutte le voci di libreria di un utente, indipendentemente
     * dallo stato.
     *
     * @param userId - id dell'utente di cui elencare la libreria.
     * @return voci di libreria dell'utente, in formato di risposta API.
     * @throws ResourceNotFoundException se l'utente non esiste.
     */
    @Transactional(readOnly = true)
    public List<UserGameResponse> getUserGames(Long userId) {
        validateUser(userId);
        return userGameRepo.findByUser_Id(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Restituisce le voci di libreria di un utente filtrate per stato.
     *
     * @param userId - id dell'utente di cui elencare la libreria.
     * @param status - uno tra "wishlist", "playing", "finished", "abandoned".
     * @return voci di libreria dell'utente con lo stato indicato.
     * @throws ResourceNotFoundException se l'utente non esiste.
     * @throws IllegalArgumentException se status non è uno dei valori validi.
     */
    @Transactional(readOnly = true)
    public List<UserGameResponse> getUserGamesByStatus(Long userId, String status) {
        validateUser(userId);
        validateStatus(status);
        return userGameRepo.findByUser_IdAndStatus(userId, status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Aggiunge un gioco alla libreria dell'utente con lo stato indicato
     * (o "wishlist" se non specificato).
     *
     * Invalida la cache delle statistiche dell'utente: aggiungere un
     * gioco cambia il conteggio totale e la distribuzione per
     * genere/sviluppatore/anno mostrata in {@link StatsService#getUserStats}.
     *
     * @param userId - id dell'utente a cui aggiungere il gioco.
     * @param req - dati della nuova voce (gameId obbligatorio; status,
     *   playTimeMin, notes opzionali).
     * @return la voce di libreria appena creata, in formato di risposta API.
     * @throws ResourceNotFoundException se l'utente o il gioco non esistono.
     * @throws IllegalArgumentException se status non è valido, o se il
     *   gioco è già presente nella libreria dell'utente.
     */
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, key = "#userId")
    public UserGameResponse addGame(Long userId, UserGameRequest req) {
        validateUser(userId);
        if (req.getGameId() == null) {
            throw new IllegalArgumentException("Game ID is required");
        }
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
        }
        Game game = gameRepo.findById(req.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", req.getGameId()));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (userGameRepo.existsByUser_IdAndGame_Id(userId, req.getGameId())) {
            throw new IllegalArgumentException("Game already in user's library");
        }

        UserGame ug = new UserGame();
        ug.setUser(user);
        ug.setGame(game);
        ug.setStatus(req.getStatus() != null ? req.getStatus() : "wishlist");
        ug.setPlayTimeMin(req.getPlayTimeMin() != null ? req.getPlayTimeMin() : 0);
        ug.setNotes(req.getNotes());
        return toResponse(userGameRepo.save(ug));
    }

    /**
     * Aggiorna stato, tempo di gioco e/o note di una voce di libreria
     * esistente. Ogni campo di req è opzionale: solo quelli non-null
     * vengono applicati, gli altri restano invariati.
     *
     * Invalida la cache delle statistiche dell'utente: un cambio di stato
     * (es. wishlist -> playing) sposta il conteggio da una categoria
     * all'altra in {@link StatsService#getUserStats}.
     *
     * @param userId - id dell'utente proprietario della voce (usato per
     *   verificare che la voce appartenga davvero a lui, non solo per
     *   l'eviction della cache).
     * @param id - id della voce di libreria da aggiornare.
     * @param req - campi da aggiornare (status, playTimeMin, notes; solo
     *   i non-null vengono applicati).
     * @return la voce di libreria aggiornata, in formato di risposta API.
     * @throws ResourceNotFoundException se la voce non esiste o non
     *   appartiene a questo utente.
     * @throws IllegalArgumentException se il nuovo status non è valido.
     */
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, key = "#userId")
    public UserGameResponse update(Long userId, Long id, UserGameRequest req) {
        UserGame ug = userGameRepo.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserGame", "id", id));

        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            ug.setStatus(req.getStatus());
        }
        if (req.getPlayTimeMin() != null) {
            ug.setPlayTimeMin(req.getPlayTimeMin());
        }
        if (req.getNotes() != null) {
            ug.setNotes(req.getNotes());
        }
        return toResponse(userGameRepo.save(ug));
    }

    /**
     * Rimuove una voce dalla libreria dell'utente.
     *
     * Invalida la cache delle statistiche dell'utente: rimuovere un gioco
     * cambia il conteggio totale e tutte le distribuzioni mostrate in
     * {@link StatsService#getUserStats}.
     *
     * @param userId - id dell'utente proprietario della voce.
     * @param id - id della voce di libreria da rimuovere.
     * @throws ResourceNotFoundException se la voce non esiste o non
     *   appartiene a questo utente.
     */
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, key = "#userId")
    public void removeGame(Long userId, Long id) {
        UserGame ug = userGameRepo.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserGame", "id", id));
        userGameRepo.deleteByIdAndUserId(ug.getId(), userId);
    }

    /**
     * Verifica che l'utente esista.
     *
     * @param userId - id utente da verificare.
     * @throws ResourceNotFoundException se nessun utente ha questo id.
     */
    private void validateUser(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
    }

    /**
     * Verifica che lo stato indicato sia uno dei valori validi.
     *
     * @param status - valore da verificare.
     * @throws IllegalArgumentException se status non è uno tra "wishlist",
     *   "playing", "finished", "abandoned".
     */
    private void validateStatus(String status) {
        for (String s : VALID_STATUSES) {
            if (s.equals(status)) return;
        }
        throw new IllegalArgumentException("Invalid status: '" + status + "'. Must be one of: wishlist, playing, finished, abandoned");
    }

    /**
     * Converte un'entità UserGame nel DTO di risposta esposto dall'API,
     * includendo un riepilogo del gioco collegato (id, nome, immagine,
     * generi come stringa CSV).
     *
     * @param ug - entità da convertire.
     * @return DTO pronto per la serializzazione JSON verso il frontend.
     */
    private UserGameResponse toResponse(UserGame ug) {
        UserGameResponse r = new UserGameResponse();
        r.setId(ug.getId());
        r.setUserId(ug.getUser().getId());
        r.setStatus(ug.getStatus());
        r.setPlayTimeMin(ug.getPlayTimeMin());
        r.setNotes(ug.getNotes());
        r.setAddedAt(ug.getAddedAt());
        r.setUpdatedAt(ug.getUpdatedAt());

        UserGameResponse.GameSummary game = new UserGameResponse.GameSummary();
        game.setId(ug.getGame().getId());
        game.setName(ug.getGame().getName());
        game.setHeaderImageUrl(ug.getGame().getHeaderImageUrl());
        game.setGenres(ug.getGame().getGenres().stream().map(com.archetype.lbp.model.Genre::getName).collect(java.util.stream.Collectors.joining(",")));
        r.setGame(game);

        return r;
    }
}
