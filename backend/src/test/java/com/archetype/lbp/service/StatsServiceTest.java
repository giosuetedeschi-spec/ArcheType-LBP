package com.archetype.lbp.service;

import com.archetype.lbp.model.Game;
import com.archetype.lbp.model.User;
import com.archetype.lbp.model.UserGame;

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
    private UserGameRepository userGameRepo;

    @Mock
    private UserRepository userRepo;

    @InjectMocks
    private StatsService statsService;

    private Game game;
    private User user;

    @BeforeEach
    void setUp() {
        game = new Game();
        game.setId(1L);
        game.setName("Test Game");
        game.setPrice(new BigDecimal("29.99"));
        game.setRating(new BigDecimal("4.5"));

        user = new User();
        user.setId(1L);
        user.setUsername("tester");
    }

    @Test
    void getUserStats_returnsCorrectCounts() {
        UserGame ug1 = new UserGame(); ug1.setStatus("playing");  ug1.setUser(user); ug1.setGame(game);
        UserGame ug2 = new UserGame(); ug2.setStatus("finished"); ug2.setUser(user); ug2.setGame(game);
        UserGame ug3 = new UserGame(); ug3.setStatus("wishlist"); ug3.setUser(user); ug3.setGame(game);

        when(userRepo.existsById(1L)).thenReturn(true);
        when(userGameRepo.findByUser_Id(1L)).thenReturn(List.of(ug1, ug2, ug3));

        UserStatsResponse stats = statsService.getUserStats(1L);
        assertThat(stats.getTotalGames()).isEqualTo(3);
        assertThat(stats.getPlayingCount()).isEqualTo(1);
        assertThat(stats.getFinishedCount()).isEqualTo(1);
        assertThat(stats.getWishlistCount()).isEqualTo(1);
    }

    @Test
    void getUserStats_emptyLibrary() {
        when(userRepo.existsById(1L)).thenReturn(true);
        when(userGameRepo.findByUser_Id(1L)).thenReturn(List.of());

        UserStatsResponse stats = statsService.getUserStats(1L);
        assertThat(stats.getTotalGames()).isZero();
        assertThat(stats.getAverageRating()).isEqualTo(0.0);
    }

    @Test
    void getUserStats_throws_whenUserNotFound() {
        when(userRepo.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> statsService.getUserStats(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
