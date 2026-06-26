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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BacklogServiceTest {

    @Mock
    private BacklogRepository backlogRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private GameRepository gameRepo;

    @InjectMocks
    private BacklogService backlogService;

    private User user;
    private Game game;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("alice");

        game = new Game();
        game.setId(1L);
        game.setSteamAppId(730);
        game.setName("Counter-Strike 2");
    }

    @Test
    void getUserGames_returnsUserBacklog() {
        Backlog b = new Backlog();
        b.setId(1L);
        b.setUser(user);
        b.setGame(game);
        b.setStatus("playing");
        when(backlogRepo.findByUserId(1L)).thenReturn(List.of(b));

        var result = backlogService.getUserGames(1L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("playing");
    }

    @Test
    void addGame_createsBacklogEntry() {
        when(userRepo.existsById(1L)).thenReturn(true);
        when(gameRepo.findById(1L)).thenReturn(Optional.of(game));
        when(backlogRepo.existsByUserIdAndGameId(1L, 1L)).thenReturn(false);
        when(backlogRepo.save(any(Backlog.class))).thenAnswer(inv -> inv.getArgument(0));

        var req = new BacklogRequest();
        req.setGameId(1L);
        req.setStatus("wishlist");

        var result = backlogService.addGame(1L, req);
        assertThat(result.getStatus()).isEqualTo("wishlist");
        assertThat(result.getUserId()).isEqualTo(1L);
    }

    @Test
    void addGame_throws_whenAlreadyExists() {
        when(userRepo.existsById(1L)).thenReturn(true);
        when(backlogRepo.existsByUserIdAndGameId(1L, 1L)).thenReturn(true);

        var req = new BacklogRequest();
        req.setGameId(1L);
        req.setStatus("wishlist");

        assertThatThrownBy(() -> backlogService.addGame(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already in user's backlog");
    }

    @Test
    void addGame_throws_whenInvalidStatus() {
        when(userRepo.existsById(1L)).thenReturn(true);
        when(backlogRepo.existsByUserIdAndGameId(1L, 1L)).thenReturn(false);

        var req = new BacklogRequest();
        req.setGameId(1L);
        req.setStatus("invalid_status");

        assertThatThrownBy(() -> backlogService.addGame(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid status");
    }

    @Test
    void updateStatus_changesStatus() {
        Backlog b = new Backlog();
        b.setId(1L);
        b.setUser(user);
        b.setGame(game);
        b.setStatus("wishlist");
        when(backlogRepo.findById(1L)).thenReturn(Optional.of(b));
        when(backlogRepo.save(any(Backlog.class))).thenReturn(b);

        var result = backlogService.updateStatus(1L, 1L, "playing");
        assertThat(result.getStatus()).isEqualTo("playing");
    }

    @Test
    void updateStatus_throws_whenNotOwner() {
        User other = new User();
        other.setId(2L);
        Backlog b = new Backlog();
        b.setId(1L);
        b.setUser(other);
        when(backlogRepo.findById(1L)).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> backlogService.updateStatus(1L, 1L, "playing"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong to this user");
    }

    @Test
    void removeGame_deletesEntry() {
        doNothing().when(backlogRepo).deleteByUserIdAndGameId(1L, 1L);
        when(userRepo.existsById(1L)).thenReturn(true);
        backlogService.removeGame(1L, 1L);
        verify(backlogRepo).deleteByUserIdAndGameId(1L, 1L);
    }
}
