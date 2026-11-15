package com.finco.audit;

/**
 * Résultat d'une action auditée.
 */
public enum ResultatAudit {

    SUCCES("Succès"),
    ECHEC("Échec");

    private final String libelle;

    ResultatAudit(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
