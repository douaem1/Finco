package com.finco.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** Corps JSON unifié des erreurs de l'API : message, statut HTTP, chemin et détails de champs. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErreurResponse(String message, Integer status, String path, List<String> erreurs) {

    public ErreurResponse(String message) {
        this(message, null, null, null);
    }

    public ErreurResponse(String message, Integer status, String path) {
        this(message, status, path, null);
    }
}
