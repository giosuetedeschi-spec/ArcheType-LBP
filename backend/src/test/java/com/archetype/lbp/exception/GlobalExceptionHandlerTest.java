package com.archetype.lbp.exception;

import com.archetype.lbp.model.Game;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFound_returns404() {
        var ex = new ResourceNotFoundException("Game", "id", 42);
        ResponseEntity<ErrorResponse> resp = handler.handleNotFound(ex);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(resp.getBody().getMessage()).isEqualTo("Game not found with id: '42'");
    }

    @Test
    void handleBadRequest_returns400() {
        var ex = new IllegalArgumentException("bad input");
        ResponseEntity<ErrorResponse> resp = handler.handleBadRequest(ex);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().getMessage()).isEqualTo("bad input");
    }

    @Test
    void handleConflict_returns409() {
        var ex = new IllegalStateException("duplicate");
        ResponseEntity<ErrorResponse> resp = handler.handleConflict(ex);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void handleMethodNotAllowed_returns405() {
        var ex = new HttpRequestMethodNotSupportedException("GET", java.util.List.of("POST", "PUT"));
        ResponseEntity<ErrorResponse> resp = handler.handleMethodNotAllowed(ex);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    @Test
    void handleGeneral_returns500() {
        var ex = new RuntimeException("boom");
        ResponseEntity<ErrorResponse> resp = handler.handleGeneral(ex);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(resp.getBody().getMessage()).isEqualTo("An unexpected error occurred");
    }

    @Test
    void handleValidation_returns400WithErrors() {
        BindingResult br = new org.springframework.validation.BeanPropertyBindingResult(new Object(), "target");
        br.addError(new FieldError("game", "name", "Name is required"));
        var ex = new MethodArgumentNotValidException(null, br);
        ResponseEntity<ErrorResponse> resp = handler.handleValidation(ex);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().getMessage()).contains("Name is required");
    }

    @Test
    void errorResponse_hasTimestamp() {
        var err = new ErrorResponse(404, "Not Found", "missing", java.time.LocalDateTime.now());
        assertThat(err.getTimestamp()).isNotNull();
        assertThat(err.getStatus()).isEqualTo(404);
        assertThat(err.getError()).isEqualTo("Not Found");
    }
}
