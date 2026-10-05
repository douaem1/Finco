package com.finco.exception;

/** Levée quand un élément demandé n'existe pas (id inconnu). Traduite en HTTP 404. */
public class RessourceIntrouvableException extends RuntimeException {

    public RessourceIntrouvableException(String message) {
        super(message);
    }
}
