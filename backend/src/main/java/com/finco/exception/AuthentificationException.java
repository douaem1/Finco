package com.finco.exception;

/** Échec d'authentification (code OTP faux, expiré...). Traduite en HTTP 401. */
public class AuthentificationException extends RuntimeException {

    public AuthentificationException(String message) {
        super(message);
    }
}
