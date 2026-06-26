package com.archetype.lbp.service;

import com.archetype.lbp.*;
import com.archetype.lbp.dto.*;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepo;

    @InjectMocks
    private GameService gameService;

    private Game game;

    @BeforeEach
    void setUp() {
        game = new Game();
        game.setId(1L);
        game.setSteamAppId(730);
        game.setName("Counter-Strike 2");
        game.setPrice(BigDecimal.ZERO);
        game.setRating(new BigDecimal("4.5"));
        game.setDeveloper("Valve");
        game.setPublisher("Valve");
        game.setDescription("FPS game");
    }

    @Test
    void listAll_returnsAllGames() {
        when(gameRepo.findAll()).thenReturn(List.of(game));
        var result = gameService.listAll();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Counter-Strike 2");
    }

    @Test
    void getById_returnsGame() {
        when(gameRepo.findById(1L)).thenReturn(Optional.of(game));
        var result = gameService.getById(1L);
        assertThat(result.getName()).isEqualTo("Counter-Strike 2");
        assertThat(result.getSteamAppId()).isEqualTo(730);
    }

    @Test
    void getById_throwsNotFound_whenMissing() {
        when(gameRepo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> gameService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Game not found with id: '99'");
    }

    @Test
    void create_savesAndReturns() {
        when(gameRepo.save(any(Game.class))).thenReturn(game);
        var req = new GameRequest();
        req.setSteamAppId(730);
        req.setName("Counter-Strike 2");
        req.setPrice(BigDecimal.ZERO);
        req.setRating(new BigDecimal("4.5"));

        var result = gameService.create(req);
        assertThat(result.getName()).isEqualTo("Counter-Strike 2");
        verify(gameRepo).save(any(Game.class));
    }

    @Test
    void delete_removesGame() {
        when(gameRepo.existsById(1L)).thenReturn(true);
        doNothing().when(gameRepo).deleteById(1L);
        gameService.delete(1L);
        verify(gameRepo).deleteById(1L);
    }

    @Test
    void delete_throwsNotFound_whenMissing() {
        when(gameRepo.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> gameService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void filter_returnsPagedResult() {
        Page<Game> page = new PageImpl<>(List.of(game), PageRequest.of(0, 20), 1);
        when(gameRepo.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        var filterReq = new GameFilterRequest();
        filterReq.setName("counter");
        filterReq.setPage(0);
        filterReq.setSize(20);

        var result = gameService.filter(filterReq);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void create_responseHasExpectedFields() {
        when(gameRepo.save(any(Game.class))).thenReturn(game);
        var req = new GameRequest();
        req.setSteamAppId(730);
        req.setName("Counter-Strike 2");
        req.setDeveloper("Valve");
        req.setPublisher("Valve");
        req.setPrice(BigDecimal.ZERO);
        req.setRating(new BigDecimal("4.5"));
        req.setDescription("FPS game");

        var response = gameService.create(req);
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getSteamAppId()).isEqualTo(730);
        assertThat(response.getName()).isEqualTo("Counter-Strike 2");
        assertThat(response.getDeveloper()).isEqualTo("Valve");
        assertThat(response.getPublisher()).isEqualTo("Valve");
        assertThat(response.getRating()).isEqualByComparingTo(new BigDecimal("4.5"));
    }
}
