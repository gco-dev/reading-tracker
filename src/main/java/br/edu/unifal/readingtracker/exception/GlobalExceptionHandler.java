package br.edu.unifal.readingtracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    public record ErrorResponseDTO(int status, String message, List<FieldErrorDTO> errors) {
    }

    public record FieldErrorDTO(String field, String message) {
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationException(MethodArgumentNotValidException ex) {
        List<FieldErrorDTO> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> new FieldErrorDTO(
                        err.getField(),
                        (err.getDefaultMessage() != null && !err.getDefaultMessage().isBlank())
                                ? err.getDefaultMessage()
                                : "Invalid field value"
                ))
                .toList();

        ErrorResponseDTO response = new ErrorResponseDTO(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed for request data",
                fieldErrors
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler({IllegalStateException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponseDTO> handleBusinessRuleException(RuntimeException ex) {
        HttpStatus status = (ex instanceof IllegalStateException)
                ? HttpStatus.CONFLICT
                : HttpStatus.BAD_REQUEST;

        String defaultMessage = (status == HttpStatus.CONFLICT)
                ? "Operation conflicts with the current state of the resource"
                : "Invalid business rule argument";

        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : defaultMessage;

        ErrorResponseDTO response = new ErrorResponseDTO(
                status.value(),
                message,
                List.of()
        );

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponseDTO> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatusCode statusCode = ex.getStatusCode();

        String message = (ex.getReason() != null && !ex.getReason().isBlank())
                ? ex.getReason()
                : "Request could not be processed";

        ErrorResponseDTO response = new ErrorResponseDTO(
                statusCode.value(),
                message,
                List.of()
        );

        return ResponseEntity.status(statusCode).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleUnexpectedException(Exception ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected internal server error occurred",
                List.of()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}