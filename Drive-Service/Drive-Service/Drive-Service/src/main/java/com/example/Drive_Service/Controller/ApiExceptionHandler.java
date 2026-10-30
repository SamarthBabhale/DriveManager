package com.example.Drive_Service.Controller;

import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Turns Storage-Service failures into clean HTTP errors instead of a 500. */
@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(FeignException.class)
    public ProblemDetail storageFailure(FeignException e) {
        log.warn("Storage-Service call failed (status {})", e.status(), e);
        HttpStatus status;
        String detail;
        if (e.status() == 404) {
            status = HttpStatus.NOT_FOUND;
            detail = "Stored content not found";
        } else if (e.status() < 0) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            detail = "Storage service is unavailable";
        } else {
            status = HttpStatus.BAD_GATEWAY;
            detail = "Storage service returned an error";
        }
        return ProblemDetail.forStatusAndDetail(status, detail);
    }
}
