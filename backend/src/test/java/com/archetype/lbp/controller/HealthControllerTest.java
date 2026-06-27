package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class HealthControllerTest {

    @Test
    void health_dbUp_returns200() throws SQLException {
        DataSource ds = mock(DataSource.class);
        Connection conn = mock(Connection.class);
        when(ds.getConnection()).thenReturn(conn);

        HealthController controller = new HealthController(ds);
        ResponseEntity<ApiResponse<Map<String, Object>>> resp = controller.health();

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = resp.getBody().getData();
        assertThat(data.get("status")).isEqualTo("UP");
        assertThat(data.get("database")).isEqualTo("UP");
    }

    @Test
    void health_dbDown_returns200WithDown() throws SQLException {
        DataSource ds = mock(DataSource.class);
        when(ds.getConnection()).thenThrow(new SQLException("connection refused"));

        HealthController controller = new HealthController(ds);
        ResponseEntity<ApiResponse<Map<String, Object>>> resp = controller.health();

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = resp.getBody().getData();
        assertThat(data.get("status")).isEqualTo("UP");
        assertThat(data.get("database").toString()).startsWith("DOWN");
    }
}
