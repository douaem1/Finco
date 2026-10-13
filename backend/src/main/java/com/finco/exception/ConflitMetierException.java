package com.finco.exception;

/**
 * Exception levée lorsqu'une règle d'unicité ou un conflit d'intégrité métier est enfreint (409 Conflict).
 * Le paramètre facultatif « champ » désigne le champ du formulaire concerné (ex. "code").
 */
public class ConflitMetierException extends RuntimeException {

    private final String champ;

    public ConflitMetierException(String message) {
        this(null, message);
    }

    public ConflitMetierException(String champ, String message) {
        super(message);
        this.champ = champ;
    }

    public String getChamp() {
        return champ;
    }
}
