package com.archetype.lbp.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Not Found", ex.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "Bad Request", ex.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(409, "Conflict", ex.getMessage(), LocalDateTime.now()));
    }

    // BindException copre entrambe le vie con cui arriva un errore di
    // validazione: MethodArgumentNotValidException (corpo JSON con @Valid
    // @RequestBody) ne è una sottoclasse diretta, e lo stesso handler serve
    // anche i parametri @Valid legati da query string (es. GameFilterRequest,
    // LeaderboardFilterRequest) — senza questo, quei casi finivano nel
    // catch-all generico e uscivano come 500 invece di un 400 con il
    // messaggio del campo che non valida.
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleValidation(BindException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "Validation Error", errors, LocalDateTime.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        // Prima non veniva mai loggata: ogni 500 era un vicolo cieco,
        // impossibile da diagnosticare senza rimetterci mano a mano
        // (issue #19/#140). Il messaggio restituito al client resta
        // generico apposta (non si vogliono esporre dettagli interni),
        // ma il log server-side ora ha lo stack trace reale.
        log.error("Errore non gestito", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, "Internal Server Error", "An unexpected error occurred", LocalDateTime.now()));
    }
}
