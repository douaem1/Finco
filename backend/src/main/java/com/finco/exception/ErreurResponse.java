package com.finco.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Corps JSON renvoyé par l'API en cas d'erreur.
 *
 * - message : message principal, en français, affiché tel quel par React ;
 * - champs  : (facultatif) erreurs rattachées à un champ du formulaire,
 *             ex. { "ice": "L'ICE doit comporter exactement 15 chiffres." }.
 *             React s'en sert pour encadrer le bon champ en rouge.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErreurResponse(String message, Integer status, String path, List<String> erreurs,
                             Map<String, String> champs) {

    public ErreurResponse(String message) {
        this(message, null, null, null, null);
    }

    public ErreurResponse(String message, Integer status, String path) {
        this(message, status, path, null, null);
    }

    public ErreurResponse(String message, Integer status, String path, List<String> erreurs) {
        this(message, status, path, erreurs, null);
    }
}
