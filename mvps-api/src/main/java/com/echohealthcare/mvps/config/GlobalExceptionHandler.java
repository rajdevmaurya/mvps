package com.echohealthcare.mvps.config;

import com.echohealthcare.mvps.model.ErrorResponse;
import com.echohealthcare.mvps.model.ErrorResponseError;
import com.echohealthcare.mvps.model.ErrorResponseErrorDetailsInner;
import com.echohealthcare.mvps.service.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Collections;

@RestControllerAdvice
public class GlobalExceptionHandler {

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
        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        ErrorResponseError error = new ErrorResponseError();
        error.setCode("INTERNAL_SERVER_ERROR");
        error.setMessage("An unexpected error occurred");
        errorResponse.setError(error);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
