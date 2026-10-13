package com.finco.exception;

/** Exception levée lorsqu'une règle d'unicité ou un conflit d'intégrité métier est enfreint (409 Conflict). */
public class ConflitMetierException extends RuntimeException {

    public ConflitMetierException(String message) {
        super(message);
    }
}
