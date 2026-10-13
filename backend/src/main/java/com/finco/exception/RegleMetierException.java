package com.finco.exception;

/**
 * Levée par la couche Service quand une règle métier est violée
 * (code en double, écriture déséquilibrée...). Traduite en HTTP 400.
 *
 * Le paramètre facultatif « champ » indique quel champ du formulaire est en cause
 * (ex. "ice"), pour que l'interface puisse le mettre en évidence.
 */
public class RegleMetierException extends RuntimeException {

    private final String champ;

    public RegleMetierException(String message) {
        this(null, message);
    }

    public RegleMetierException(String champ, String message) {
        super(message);
        this.champ = champ;
    }

    public String getChamp() {
        return champ;
    }
}
