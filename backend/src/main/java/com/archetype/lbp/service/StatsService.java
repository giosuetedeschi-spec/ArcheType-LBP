package com.archetype.lbp.service;

import com.archetype.lbp.Backlog;
import com.archetype.lbp.dto.UserStatsResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.BacklogRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {
    private final BacklogRepository backlogRepo;
    private final UserRepository userRepo;

    public UserStatsResponse getUserStats(Long userId) {
        validateUser(userId);

        var backlogs = backlogRepo.findByUserId(userId);

        UserStatsResponse stats = new UserStatsResponse();
        stats.setTotalGames(backlogs.size());
        stats.setWishlistCount(backlogs.stream().filter(b -> "wishlist".equals(b.getStatus())).count());
        stats.setPlayingCount(backlogs.stream().filter(b -> "playing".equals(b.getStatus())).count());
        stats.setFinishedCount(backlogs.stream().filter(b -> "finished".equals(b.getStatus())).count());
        stats.setAbandonedCount(backlogs.stream().filter(b -> "abandoned".equals(b.getStatus())).count());

        stats.setGamesByGenre(groupByGenre(backlogs));
        stats.setGamesByDeveloper(groupByDeveloper(backlogs));
        stats.setGamesByYear(groupByYear(backlogs));

        stats.setAverageRating(calculateAverageRating(backlogs));
        stats.setTotalSpent(calculateTotalSpent(backlogs));

        return stats;
    }

    private void validateUser(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
    }

    private Map<String, Long> groupByGenre(java.util.List<Backlog> backlogs) {
        return backlogs.stream()
                .filter(b -> b.getGame().getGenres() != null)
                .flatMap(b -> java.util.Arrays.stream(b.getGame().getGenres().split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.groupingBy(g -> g, Collectors.counting()));
    }

    private Map<String, Long> groupByDeveloper(java.util.List<Backlog> backlogs) {
        return backlogs.stream()
                .filter(b -> b.getGame().getDeveloper() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getGame().getDeveloper().getName(),
                        Collectors.counting()
                ));
    }

    private Map<String, Long> groupByYear(java.util.List<Backlog> backlogs) {
        return backlogs.stream()
                .filter(b -> b.getGame().getReleaseDate() != null)
                .collect(Collectors.groupingBy(
                        b -> String.valueOf(b.getGame().getReleaseDate().getYear()),
                        Collectors.counting()
                ));
    }

    private Double calculateAverageRating(java.util.List<Backlog> backlogs) {
        return backlogs.stream()
                .filter(b -> b.getGame().getRating() != null)
                .mapToDouble(b -> b.getGame().getRating().doubleValue())
                .average()
                .orElse(0.0);
    }

    private Double calculateTotalSpent(java.util.List<Backlog> backlogs) {
        return backlogs.stream()
                .filter(b -> b.getGame().getPrice() != null)
                .mapToDouble(b -> b.getGame().getPrice().doubleValue())
                .sum();
    }
}
