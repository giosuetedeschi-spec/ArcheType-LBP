package com.archetype.lbp.service;

import com.archetype.lbp.model.Genre;
import com.archetype.lbp.model.User;
import com.archetype.lbp.model.UserGame;

import com.archetype.lbp.dto.UserStatsResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.UserGameRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {
    private final UserGameRepository userGameRepo;
    private final UserRepository userRepo;

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

    private void validateUser(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
    }

    private Map<String, Long> groupByGenre(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getGenres() != null)
                .flatMap(ug -> ug.getGame().getGenres().stream())
                .map(Genre::getName)
                .collect(Collectors.groupingBy(g -> g, Collectors.counting()));
    }

    private Map<String, Long> groupByDeveloper(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getDeveloper() != null)
                .collect(Collectors.groupingBy(
                        ug -> ug.getGame().getDeveloper().getName(),
                        Collectors.counting()
                ));
    }

    private Map<String, Long> groupByYear(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getReleaseDate() != null)
                .collect(Collectors.groupingBy(
                        ug -> String.valueOf(ug.getGame().getReleaseDate().getYear()),
                        Collectors.counting()
                ));
    }

    private Double calculateAverageRating(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getRating() != null)
                .mapToDouble(ug -> ug.getGame().getRating().doubleValue())
                .average()
                .orElse(0.0);
    }

    private Double calculateTotalSpent(java.util.List<UserGame> userGames) {
        return userGames.stream()
                .filter(ug -> ug.getGame().getPrice() != null)
                .mapToDouble(ug -> ug.getGame().getPrice().doubleValue())
                .sum();
    }
}
