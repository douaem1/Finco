package com.finco.audit;

/**
 * Catégorie fonctionnelle d'une action d'audit.
 * Sert au filtrage et à la couleur des badges côté interface.
 */
public enum CategorieAudit {

    CONNEXION("Connexion"),
    COMPTABILITE("Comptabilité"),
    FACTURATION("Facturation"),
    PAIEMENT("Paiement"),
    CLOTURE("Clôture"),
    CONTROLE_GESTION("Contrôle de gestion"),
    ADMINISTRATION("Administration"),
    EXPORT("Export");

    private final String libelle;

    CategorieAudit(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
