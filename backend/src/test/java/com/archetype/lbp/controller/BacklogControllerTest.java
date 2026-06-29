package com.archetype.lbp.controller;

import com.archetype.lbp.dto.*;
import com.archetype.lbp.service.BacklogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BacklogControllerTest {

    @Mock private BacklogService backlogService;
    @InjectMocks private BacklogController controller;

    @Test
    void list_noFilter_returns200() {
        when(backlogService.getUserGames(1L)).thenReturn(List.of());
        var resp = controller.list(1L, null);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(backlogService).getUserGames(1L);
    }

    @Test
    void list_withStatusFilter_returns200() {
        when(backlogService.getUserGamesByStatus(1L, "playing")).thenReturn(List.of());
        var resp = controller.list(1L, "playing");
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(backlogService).getUserGamesByStatus(1L, "playing");
    }

    @Test
    void add_returns201() {
        var req = new BacklogRequest(); req.setGameId(1L); req.setStatus("wishlist");
        var created = new BacklogResponse(); created.setStatus("wishlist");
        when(backlogService.addGame(eq(1L), any())).thenReturn(created);

        var resp = controller.add(1L, req);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void update_returns200() {
        var req = new BacklogRequest(); req.setStatus("playing");
        var updated = new BacklogResponse(); updated.setStatus("playing");
        when(backlogService.updateStatus(1L, 1L, "playing")).thenReturn(updated);

        var resp = controller.update(1L, 1L, req);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void remove_returns200() {
        doNothing().when(backlogService).removeGame(1L, 1L);
        var resp = controller.remove(1L, 1L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
