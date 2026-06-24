package com.archetype.lbp.service;

import com.archetype.lbp.*;
import com.archetype.lbp.dto.UserStatsResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock
    private BacklogRepository backlogRepo;

    @Mock
    private UserRepository userRepo;

    @InjectMocks
    private StatsService statsService;

    private Game game;

    @BeforeEach
    void setUp() {
        game = new Game();
        game.setId(1L);
        game.setName("Test Game");
        game.setPrice(new BigDecimal("29.99"));
        game.setRating(new BigDecimal("4.5"));
    }

    @Test
    void getUserStats_returnsCorrectCounts() {
        Backlog b1 = new Backlog();
        b1.setStatus("playing");
        b1.setGame(game);
        Backlog b2 = new Backlog();
        b2.setStatus("finished");
        b2.setGame(game);
        Backlog b3 = new Backlog();
        b3.setStatus("wishlist");
        b3.setGame(game);

        when(userRepo.existsById(1L)).thenReturn(true);
        when(backlogRepo.findByUserId(1L)).thenReturn(List.of(b1, b2, b3));

        UserStatsResponse stats = statsService.getUserStats(1L);
        assertThat(stats.getTotalGames()).isEqualTo(3);
        assertThat(stats.getPlayingCount()).isEqualTo(1);
        assertThat(stats.getFinishedCount()).isEqualTo(1);
        assertThat(stats.getWishlistCount()).isEqualTo(1);
        assertThat(stats.getTotalSpent()).isEqualTo(new BigDecimal("89.97"));
        assertThat(stats.getAverageRating()).isEqualTo(4.5);
    }

    @Test
    void getUserStats_emptyBacklog() {
        when(userRepo.existsById(1L)).thenReturn(true);
        when(backlogRepo.findByUserId(1L)).thenReturn(List.of());

        UserStatsResponse stats = statsService.getUserStats(1L);
        assertThat(stats.getTotalGames()).isZero();
        assertThat(stats.getAverageRating()).isEqualTo(0.0);
        assertThat(stats.getTotalSpent()).isEqualTo(0.0);
    }

    @Test
    void getUserStats_throws_whenUserNotFound() {
        when(userRepo.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> statsService.getUserStats(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
