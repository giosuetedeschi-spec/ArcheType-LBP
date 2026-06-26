package com.archetype.lbp.controller;

import com.archetype.lbp.dto.UserStatsResponse;
import com.archetype.lbp.service.StatsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    @Mock
    private StatsService statsService;

    @InjectMocks
    private StatsController controller;

    @Test
    void stats_returns200() {
        UserStatsResponse stats = new UserStatsResponse();
        stats.setTotalGames(5);
        when(statsService.getUserStats(1L)).thenReturn(stats);

        var resp = controller.stats(1L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().getData().getTotalGames()).isEqualTo(5);
    }
}
