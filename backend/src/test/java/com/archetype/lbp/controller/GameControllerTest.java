package com.archetype.lbp.controller;

import com.archetype.lbp.dto.*;
import com.archetype.lbp.service.GameService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameControllerTest {

    @Mock private GameService gameService;
    @InjectMocks private GameController controller;

    private PagedResponse<GameResponse> pagedOf(GameResponse... games) {
        PagedResponse<GameResponse> p = new PagedResponse<>();
        p.setContent(List.of(games));
        p.setPage(0); p.setSize(20);
        p.setTotalElements(games.length); p.setTotalPages(1);
        return p;
    }

    @Test
    void list_returns200_paged() {
        var game = new GameResponse(); game.setId(1L); game.setName("CS2");
        when(gameService.filter(any())).thenReturn(pagedOf(game));

        var resp = controller.list(0, 20);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().getData().getContent()).hasSize(1);
    }

    @Test
    void get_returns200() {
        var game = new GameResponse(); game.setId(1L); game.setName("CS2");
        when(gameService.getById(1L)).thenReturn(game);

        var resp = controller.get(1L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().getData().getName()).isEqualTo("CS2");
    }

    @Test
    void create_returns201() {
        var req = new GameRequest(); req.setSteamAppId(730); req.setName("CS2");
        var created = new GameResponse(); created.setName("CS2");
        when(gameService.create(any())).thenReturn(created);

        var resp = controller.create(req);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void search_returns200() {
        var game = new GameResponse(); game.setName("Elden Ring");
        when(gameService.search(eq("elden"), anyInt())).thenReturn(List.of(game));

        var resp = controller.search("elden", 20);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().getData()).hasSize(1);
    }

    @Test
    void delete_returns200() {
        doNothing().when(gameService).delete(1L);
        var resp = controller.delete(1L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
