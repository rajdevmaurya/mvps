package com.echohealthcare.mvps.config;

import com.echohealthcare.mvps.model.ErrorResponse;
import com.echohealthcare.mvps.model.ErrorResponseError;
import com.echohealthcare.mvps.model.ErrorResponseErrorDetailsInner;
import com.echohealthcare.mvps.service.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        ErrorResponseErrorDetailsInner detail = new ErrorResponseErrorDetailsInner();
        detail.setField(null);
        detail.setMessage(ex.getMessage());
        ErrorResponseError error = new ErrorResponseError();
        error.setCode("NOT_FOUND");
        error.setMessage(ex.getMessage());
        error.setDetails(Collections.singletonList(detail));
        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        ErrorResponseError error = new ErrorResponseError();
        error.setCode("VALIDATION_ERROR");
        error.setMessage("Invalid input data");

        List<ErrorResponseErrorDetailsInner> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> {
                    ErrorResponseErrorDetailsInner detail = new ErrorResponseErrorDetailsInner();
                    detail.setField(fieldError.getField());
                    detail.setMessage(fieldError.getDefaultMessage());
                    return detail;
                })
                .collect(Collectors.toList());
        error.setDetails(details);

        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Invalid argument: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        ErrorResponseError error = new ErrorResponseError();
        error.setCode("INVALID_ARGUMENT");
        error.setMessage(ex.getMessage());
        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        ErrorResponseError error = new ErrorResponseError();
        error.setCode("CONSTRAINT_VIOLATION");
        error.setMessage("The operation violates a data constraint. A related record may already exist or a required reference is missing.");
        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Request body could not be parsed: {}", ex.getMessage(), ex);
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        ErrorResponseError error = new ErrorResponseError();
        error.setCode("INVALID_REQUEST");
        error.setMessage("Request body is malformed or contains invalid JSON");
        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception caught", ex);
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        ErrorResponseError error = new ErrorResponseError();
        error.setCode("INTERNAL_SERVER_ERROR");
        error.setMessage("An unexpected error occurred");
        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
