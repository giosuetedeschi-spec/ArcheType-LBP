package com.archetype.lbp.service;

import com.archetype.lbp.config.CacheConfig;
import com.archetype.lbp.model.Genre;
import com.archetype.lbp.model.User;
import com.archetype.lbp.model.UserGame;

import com.archetype.lbp.dto.UserStatsResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.UserGameRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Calcola le statistiche aggregate della libreria di un utente (conteggi
 * per stato, distribuzione per genere/sviluppatore/anno, voto medio, spesa
 * totale).
 *
 * getUserStats è cacheata (vedi {@link CacheConfig}): il calcolo scorre
 * l'intera libreria dell'utente e la aggrega in più modi, un costo che non
 * vale la pena ripagare ad ogni richiesta dato che i dati sottostanti
 * cambiano solo quando l'utente modifica la libreria — mutazioni gestite
 * da {@link UserGameService}, che invalida questa stessa cache ad ogni
 * scrittura riuscita.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {
    private final UserGameRepository userGameRepo;
    private final UserRepository userRepo;

    /**
     * Calcola le statistiche complete della libreria di un utente.
     *
     * Risultato cacheato per userId (cache "userStats", vedi
     * {@link CacheConfig#USER_STATS_CACHE}): chiamate ripetute con lo
     * stesso userId non ricalcolano l'aggregazione finché la cache non
     * viene invalidata da una scrittura in {@link UserGameService}, o
     * scade per TTL (rete di sicurezza, vedi CacheConfig).
     *
     * @param userId - id dell'utente di cui calcolare le statistiche.
     * @return statistiche aggregate: conteggi per stato, distribuzione per
     *   genere/sviluppatore/anno di uscita, voto medio, spesa totale.
     * @throws ResourceNotFoundException se l'utente non esiste.
     */
    @Cacheable(cacheNames = CacheConfig.USER_STATS_CACHE, key = "#userId")
    public UserStatsResponse getUserStats(Long userId) {
        validateUser(userId);

        var userGames = userGameRepo.findByUser_Id(userId);

        UserStatsResponse stats = new UserStatsResponse();
        stats.setTotalGames(userGames.size());
        stats.setWishlistCount(userGames.stream().filter(ug -> "wishlist".equals(ug.getStatus())).count());
        stats.setPlayingCount(userGames.stream().filter(ug -> "playing".equals(ug.getStatus())).count());
        stats.setFinishedCount(userGames.stream().filter(ug -> "finished".equals(ug.getStatus())).count());
        stats.setAbandonedCount(userGames.stream().filter(ug -> "abandoned".equals(ug.getStatus())).count());

        stats.setGamesByGenre(groupByGenre(userGames));
        stats.setGamesByDeveloper(groupByDeveloper(userGames));
        stats.setGamesByYear(groupByYear(userGames));

        stats.setAverageRating(calculateAverageRating(userGames));
        stats.setTotalSpent(calculateTotalSpent(userGames));

        return stats;
    }

    /**
     * Verifica che l'utente esista prima di procedere col calcolo.
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
     * Conta quanti giochi in libreria appartengono a ciascun genere.
     * Un gioco con più generi contribuisce al conteggio di ognuno di essi.
     *
     * @param userGames - voci di libreria dell'utente.
     * @return mappa nome-genere -> numero di giochi in libreria con quel genere.
     */
    private Map<String, Long> groupByGenre(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getGenres() != null)
                .flatMap(ug -> ug.getGame().getGenres().stream())
                .map(Genre::getName)
                .collect(Collectors.groupingBy(g -> g, Collectors.counting()));
    }

    /**
     * Conta quanti giochi in libreria appartengono a ciascuno sviluppatore.
     *
     * @param userGames - voci di libreria dell'utente.
     * @return mappa nome-sviluppatore -> numero di giochi in libreria.
     */
    private Map<String, Long> groupByDeveloper(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getDeveloper() != null)
                .collect(Collectors.groupingBy(
                        ug -> ug.getGame().getDeveloper().getName(),
                        Collectors.counting()
                ));
    }

    /**
     * Conta quanti giochi in libreria sono usciti in ciascun anno.
     *
     * @param userGames - voci di libreria dell'utente.
     * @return mappa anno (come stringa) -> numero di giochi usciti in quell'anno.
     */
    private Map<String, Long> groupByYear(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getReleaseDate() != null)
                .collect(Collectors.groupingBy(
                        ug -> String.valueOf(ug.getGame().getReleaseDate().getYear()),
                        Collectors.counting()
                ));
    }

    /**
     * Calcola il voto medio dei giochi in libreria che hanno un rating.
     *
     * @param userGames - voci di libreria dell'utente.
     * @return media dei rating disponibili, 0.0 se nessun gioco ha un voto.
     */
    private Double calculateAverageRating(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getRating() != null)
                .mapToDouble(ug -> ug.getGame().getRating().doubleValue())
                .average()
                .orElse(0.0);
    }

    /**
     * Somma il prezzo di tutti i giochi in libreria che hanno un prezzo.
     *
     * @param userGames - voci di libreria dell'utente.
     * @return spesa totale stimata in libreria.
     */
    private Double calculateTotalSpent(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getPrice() != null)
                .mapToDouble(ug -> ug.getGame().getPrice().doubleValue())
                .sum();
    }
}
