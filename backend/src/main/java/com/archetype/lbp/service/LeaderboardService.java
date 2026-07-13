package com.archetype.lbp.service;

import com.archetype.lbp.dto.LeaderboardEntryResponse;
import com.archetype.lbp.dto.LeaderboardFilterRequest;
import com.archetype.lbp.dto.LeaderboardResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.model.User;
import com.archetype.lbp.repository.FriendRepository;
import com.archetype.lbp.repository.UserGameRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service per la generazione della classifica (leaderboard) degli utenti.
 * Supporta diversi scope (global/friends) e metriche (hours/games/friends).
 * Issue #58: aggiunto JavaDoc per documentare le operazioni disponibili.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaderboardService {
    private final UserRepository userRepo;
    private final UserGameRepository userGameRepo;
    private final FriendRepository friendRepo;

    /**
     * Genera la classifica degli utenti in base ai filtri specificati.
     * @return classifica paginata con la posizione dell'utente corrente
     */
    public LeaderboardResponse getLeaderboard(LeaderboardFilterRequest filter) {
        User viewer = userRepo.findById(filter.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", filter.getUserId()));

        Set<Long> candidateIds = resolveScope(filter.getScope(), viewer);
        Map<Long, Double> values = resolveMetric(filter.getMetric());

        List<LeaderboardEntryResponse> ranked = userRepo.findAllById(candidateIds).stream()
                .map(u -> new LeaderboardEntryResponse(0, u.getId(), u.getUsername(), u.getAvatarUrl(),
                        values.getOrDefault(u.getId(), 0.0)))
                // A parità di valore, ordine alfabetico per un risultato stabile
                // (senza questo tie-break l'ordine tra pari merito cambierebbe
                // ad ogni richiesta, dato che la mappa aggregata non è ordinata).
                .sorted(Comparator.comparingDouble(LeaderboardEntryResponse::getValue).reversed()
                        .thenComparing(LeaderboardEntryResponse::getUsername))
                .collect(Collectors.toList());

        for (int i = 0; i < ranked.size(); i++) {
            ranked.get(i).setRank(i + 1);
        }

        LeaderboardEntryResponse myEntry = ranked.stream()
                .filter(e -> e.getUserId().equals(viewer.getId()))
                .findFirst()
                .orElse(null);

        return paginate(ranked, filter.getPage(), filter.getSize(), myEntry);
    }

    /**
     * Risolve lo scope della classifica (global o friends).
     * @return set di ID utenti da includere nella classifica
     */
    private Set<Long> resolveScope(String scope, User viewer) {
        if ("friends".equals(scope)) {
            Set<Long> ids = friendRepo.findByUser_IdAndStatus(viewer.getId(), "accepted").stream()
                    .map(f -> f.getFriend().getId())
                    .collect(Collectors.toCollection(HashSet::new));
            ids.add(viewer.getId());
            return ids;
        }
        if ("global".equals(scope)) {
            return userRepo.findAll().stream().map(User::getId).collect(Collectors.toSet());
        }
        throw new IllegalArgumentException("Scope non valido: " + scope);
    }

    /**
     * Risolve la metrica della classifica (hours, games, friends).
     * @return mappa userId -> valore metrica
     */
    private Map<Long, Double> resolveMetric(String metric) {
        List<Object[]> raw = switch (metric) {
            case "hours" -> userGameRepo.sumPlayTimeMinByUser();
            case "games" -> userGameRepo.countOwnedByUser();
            case "friends" -> friendRepo.countAcceptedByUser();
            default -> throw new IllegalArgumentException("Metrica non valida: " + metric);
        };
        return raw.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> ((Number) row[1]).doubleValue()
        ));
    }

    /** Impagina la classifica e aggiunge la posizione dell'utente corrente. */
    private LeaderboardResponse paginate(List<LeaderboardEntryResponse> ranked, int page, int size,
                                          LeaderboardEntryResponse myEntry) {
        int safePage = Math.max(page, 0);
        int safeSize = size > 0 ? size : 20;
        int from = Math.min(safePage * safeSize, ranked.size());
        int to = Math.min(from + safeSize, ranked.size());

        LeaderboardResponse response = new LeaderboardResponse();
        response.setEntries(ranked.subList(from, to));
        response.setPage(safePage);
        response.setSize(safeSize);
        response.setTotalElements(ranked.size());
        response.setTotalPages((int) Math.ceil(ranked.size() / (double) safeSize));
        response.setMyEntry(myEntry);
        return response;
    }
}
