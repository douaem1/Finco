package com.finco.exception;

/** Corps JSON unique de toutes les erreurs de l'API : { "message": "..." }. */
public record ErreurResponse(String message) {
}
