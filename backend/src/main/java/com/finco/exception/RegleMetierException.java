package com.finco.exception;

/**
 * Levée par la couche Service quand une règle métier est violée
 * (code en double, écriture déséquilibrée...). Traduite en HTTP 400.
 */
public class RegleMetierException extends RuntimeException {

    public RegleMetierException(String message) {
        super(message);
    }
}
